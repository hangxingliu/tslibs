import { expect, test, describe } from "bun:test";
import { assertProps } from "./assert.js";

describe("assertProps", () => {
  test("should assert string property successfully", () => {
    const obj = { name: "test" };
    expect(assertProps(obj, "name", "string")).toBe(obj);
  });

  test("should assert number property successfully", () => {
    const obj = { age: 25 };
    expect(assertProps(obj, "age", "number")).toBe(obj);
  });

  test("should assert object property successfully", () => {
    const obj = { meta: { id: 1 } };
    expect(assertProps(obj, "meta", "object")).toBe(obj);
  });

  test("should assert array property successfully", () => {
    const obj = { tags: ["a", "b"] };
    expect(assertProps(obj, "tags", "array")).toBe(obj);
  });

  test("should throw error if object is null or undefined", () => {
    expect(() => assertProps(null as any, "prop", "string")).toThrow(
      "The type of property 'prop' in the props is not string. but undefined"
    );
    expect(() => assertProps(undefined as any, "prop", "string")).toThrow(
      "The type of property 'prop' in the props is not string. but undefined"
    );
  });

  test("should throw error if property is missing", () => {
    const obj = { other: 1 };
    expect(() => assertProps(obj as any, "missing", "string")).toThrow(
      "The type of property 'missing' in the props is not string. but undefined"
    );
  });

  test("should throw error if property type is incorrect", () => {
    const obj = { name: 123 };
    expect(() => assertProps(obj as any, "name", "string")).toThrow(
      "The type of property 'name' in the props is not string. but number"
    );
  });

  test("should throw error if array type is expected but got object", () => {
    const obj = { tags: {} };
    expect(() => assertProps(obj as any, "tags", "array")).toThrow(
      "The type of property 'tags' in the props is not array. but object"
    );
  });

  test("should use custom name in error message", () => {
    const obj = { name: 123 };
    expect(() => assertProps(obj as any, "name", "string", "UserObject")).toThrow(
      "The type of property 'name' in the UserObject is not string. but number"
    );
  });
});
