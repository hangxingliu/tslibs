/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { CompletionTuple, CompletionValue } from "./types.js";

/**
 * Converts a command/question completion value to the normalized tuple `[candidates, matched]`.
 * @param matched the input substring replaced by a candidate, used when the value does not specify one
 * @example normalizeCompletion(["abc"], "a") // => [["abc"], "a"]
 * @example normalizeCompletion({ result: ["abc"], matched: "ab" }, "a") // => [["abc"], "ab"]
 * @example normalizeCompletion(undefined, "a") // => [[], "a"]
 */
export function normalizeCompletion(completion: CompletionValue, matched: string): CompletionTuple {
  if (Array.isArray(completion)) return [completion, matched];
  return completion ? [completion.result, completion.matched ?? matched] : [[], matched];
}
