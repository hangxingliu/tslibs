import { describe, it } from "bun:test";
import { deepStrictEqual } from "node:assert";
import { completeKeyword } from "./keyword.js";

describe("completeKeyword", () => {
  it("matches keywords case-insensitively and appends a space", () => {
    deepStrictEqual(completeKeyword("ST", ["start", "Stop", "list"]), { result: ["start ", "Stop "] });
  });

  it("returns every keyword for empty input and none for unknown prefixes", () => {
    deepStrictEqual(completeKeyword("", ["a", "b"]), { result: ["a ", "b "] });
    deepStrictEqual(completeKeyword("x", ["a", "b"]), { result: [] });
  });
});
