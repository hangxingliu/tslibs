import { expect, test, describe } from "bun:test";
import type { JSONSchema } from "./schema-types.js";
import { validateSchema } from "./validator.js";

describe("validateSchema", () => {
  const schema = {
    type: "object",
    properties: {
      name: { type: "string" },
      level: { type: "integer" },
    },
    required: ["name"],
  } satisfies JSONSchema;

  test("should validate successfully with correct object", async () => {
    const data = { name: "test", level: 10 };
    const result = await validateSchema(data, schema);
    expect(result).toBe(data);
  });

  test("should throw error when required property is missing", async () => {
    try {
      await validateSchema({}, schema);
      expect.unreachable();
    } catch (error) {
      expect(error).toContain("config must have required property 'name'");
    }
  });

  test("should throw error when property type is incorrect", async () => {
    try {
      await validateSchema({ name: "test", level: "high" }, schema);
      expect.unreachable();
    } catch (error) {
      expect(error).toContain("config.level must be integer");
    }
  });

  test("should validate successfully with optional properties missing", async () => {
    const data = { name: "test" };
    const result = await validateSchema(data, schema);
    expect(result).toBe(data as any);
  });
});
