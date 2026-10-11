/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { CompletionResult } from "./types.js";

/**
 * Case-insensitively completes `str` with keywords; each candidate ends with a space.
 * @example completeKeyword("st", ["start", "stop", "list"]) // => { result: ["start ", "stop "] }
 */
export function completeKeyword(str: string, keywords: readonly string[]): CompletionResult {
  const result: string[] = [];
  const lc = str.toLowerCase();
  for (const key of keywords) {
    if (!key.toLowerCase().startsWith(lc)) continue;
    result.push(`${key} `);
  }
  return { result };
}
