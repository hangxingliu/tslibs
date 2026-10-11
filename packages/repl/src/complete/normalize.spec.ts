import { deepStrictEqual } from "node:assert";
import { normalizeCompletion } from "./normalize.js";

describe("normalizeCompletion", () => {
  it("uses the fallback matched text for arrays and objects without matched", () => {
    deepStrictEqual(normalizeCompletion(["abc"], "a"), [["abc"], "a"]);
    deepStrictEqual(normalizeCompletion({ result: ["abc"] }, "a"), [["abc"], "a"]);
  });

  it("prefers the matched text from the result object", () => {
    deepStrictEqual(normalizeCompletion({ result: ["abc"], matched: "ab" }, "a"), [["abc"], "ab"]);
    deepStrictEqual(normalizeCompletion({ result: [], matched: "" }, "a"), [[], ""]);
  });

  it("returns no candidates for void results", () => {
    deepStrictEqual(normalizeCompletion(undefined, "a"), [[], "a"]);
  });
});
