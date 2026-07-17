import { expect, test, describe } from "bun:test";
import { parseFrontmatterInMarkdown, mergeFrontmatterWithMarkdown } from "./markdown.js";

describe("parseFrontmatterInMarkdown", () => {
  test("should parse a leading YAML frontmatter block", () => {
    const markdown = "---\ntitle: Hello\ncount: 2\n---\n# Body\nContent here.";
    const result = parseFrontmatterInMarkdown(markdown);
    expect(result.frontmatter).toEqual({ title: "Hello", count: 2 });
    expect(result.markdown).toBe("# Body\nContent here.");
  });

  test("should return no frontmatter when the markdown has none", () => {
    const markdown = "# Body\nContent here.";
    const result = parseFrontmatterInMarkdown(markdown);
    expect(result.frontmatter).toBeUndefined();
    expect(result.markdown).toBe(markdown);
  });

  test("should return no frontmatter when the delimiter is not closed", () => {
    const markdown = "---\ntitle: Hello\n# Body";
    const result = parseFrontmatterInMarkdown(markdown);
    expect(result.frontmatter).toBeUndefined();
    expect(result.markdown).toBe(markdown);
  });

  test("should handle an empty frontmatter block", () => {
    const markdown = "---\n---\n# Body";
    const result = parseFrontmatterInMarkdown(markdown);
    expect(result.frontmatter).toEqual({});
    expect(result.markdown).toBe("# Body");
  });
});

describe("mergeFrontmatterWithMarkdown", () => {
  test("should return the markdown unchanged when frontmatter is nullish", () => {
    const markdown = "# Body\nContent here.";
    expect(mergeFrontmatterWithMarkdown(markdown, undefined)).toBe(markdown);
    expect(mergeFrontmatterWithMarkdown(markdown, null)).toBe(markdown);
  });

  test("should prepend a new frontmatter block when the markdown has none", () => {
    const markdown = "# Body\nContent here.";
    const merged = mergeFrontmatterWithMarkdown(markdown, { title: "Hello" });
    expect(merged).toBe("---\ntitle: Hello\n---\n# Body\nContent here.");
  });

  test("should merge with and override the existing frontmatter", () => {
    const markdown = "---\ntitle: Old\nkeep: yes\n---\n# Body";
    const merged = mergeFrontmatterWithMarkdown(markdown, { title: "New" });

    const parsed = parseFrontmatterInMarkdown(merged);
    expect(parsed.frontmatter).toEqual({ title: "New", keep: "yes" });
    expect(parsed.markdown).toBe("# Body");
  });
});
