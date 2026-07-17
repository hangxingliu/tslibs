import { expect, test, describe } from "bun:test";
import { parseYAML, stringifyYAML, getYAMLSchemaPath, getYAMLSchemaComment } from "./yaml.js";

describe("parseYAML", () => {
  test("should parse a document without any header comments", () => {
    const result = parseYAML<{ foo: string }>("foo: bar\n");
    expect(result.headers).toEqual([]);
    expect(result.doc).toEqual({ foo: "bar" });
  });

  test("should extract the yaml-language-server schema header comment", () => {
    const yaml = "# yaml-language-server: $schema=./schema.json\nfoo: bar\nbaz: 1\n";
    const result = parseYAML<{ foo: string; baz: number }>(yaml);
    expect(result.headers).toEqual([
      { line: "# yaml-language-server: $schema=./schema.json", schema: "./schema.json" },
    ]);
    expect(result.doc).toEqual({ foo: "bar", baz: 1 });
  });

  test("should keep plain comment lines without a schema field", () => {
    const yaml = "# just a comment\n# another comment\nfoo: bar\n";
    const result = parseYAML<{ foo: string }>(yaml);
    expect(result.headers).toEqual([{ line: "# just a comment" }, { line: "# another comment" }]);
    expect(result.doc).toEqual({ foo: "bar" });
  });

  test("should stop collecting headers at the first non-comment line", () => {
    const yaml = "# schema comment\nfoo: bar\n# not a header, this is a trailing comment\nbaz: 1\n";
    const result = parseYAML<{ foo: string; baz: number }>(yaml);
    expect(result.headers).toEqual([{ line: "# schema comment" }]);
    expect(result.doc).toEqual({ foo: "bar", baz: 1 });
  });
});

describe("stringifyYAML", () => {
  test("should stringify a document without headers", () => {
    const text = stringifyYAML({ foo: "bar" });
    expect(text).toBe("foo: bar\n");
  });

  test("should prepend header comment lines before the document body", () => {
    const headers = [{ line: "# yaml-language-server: $schema=./schema.json", schema: "./schema.json" }];
    const text = stringifyYAML({ foo: "bar" }, headers);
    expect(text).toBe("# yaml-language-server: $schema=./schema.json\nfoo: bar\n");
  });

  test("should round-trip through parseYAML", () => {
    const original = "# yaml-language-server: $schema=./schema.json\nfoo: bar\nbaz: 1\n";
    const parsed = parseYAML<{ foo: string; baz: number }>(original);
    const text = stringifyYAML(parsed.doc, parsed.headers);
    expect(text).toBe(original);
  });
});

describe("getYAMLSchemaPath", () => {
  test("should return undefined when no header has a schema", () => {
    const headers = [{ line: "# just a comment" }];
    expect(getYAMLSchemaPath(headers, "/project/docs/config.yaml")).toBeUndefined();
  });

  test("should resolve the first schema header relative to the document path", () => {
    const headers = [
      { line: "# a" },
      { line: "# schema1", schema: "./schemas/one.json" },
      { line: "# schema2", schema: "./schemas/two.json" },
    ];
    const result = getYAMLSchemaPath(headers, "/project/docs/config.yaml");
    expect(result).toBe("/project/docs/schemas/one.json");
  });

  test("should return an absolute schema path as-is", () => {
    const headers = [{ line: "# schema", schema: "/absolute/schema.json" }];
    expect(getYAMLSchemaPath(headers, "/project/docs/config.yaml")).toBe("/absolute/schema.json");
  });

  test("should return a URL schema as-is", () => {
    const headers = [{ line: "# schema", schema: "https://example.com/schema.json" }];
    expect(getYAMLSchemaPath(headers, "/project/docs/config.yaml")).toBe("https://example.com/schema.json");
  });
});

describe("getYAMLSchemaComment", () => {
  test("should return the schema path as-is when docPath is not provided", () => {
    expect(getYAMLSchemaComment("./schema.json")).toBe("# yaml-language-server: $schema=./schema.json");
  });

  test("should compute a relative path from docPath", () => {
    const comment = getYAMLSchemaComment("/project/schemas/one.json", "/project/docs/config.yaml");
    expect(comment).toBe("# yaml-language-server: $schema=../schemas/one.json");
  });

  test("should prefix a same-directory relative path with ./", () => {
    const comment = getYAMLSchemaComment("/project/docs/schema.json", "/project/docs/config.yaml");
    expect(comment).toBe("# yaml-language-server: $schema=./schema.json");
  });

  test("should round-trip with getYAMLSchemaPath", () => {
    const docPath = "/project/docs/config.yaml";
    const schemaPath = "/project/schemas/one.json";
    const comment = getYAMLSchemaComment(schemaPath, docPath);
    const parsed = parseYAML(`${comment}\nfoo: bar\n`);
    expect(getYAMLSchemaPath(parsed.headers, docPath)).toBe(schemaPath);
  });
});
