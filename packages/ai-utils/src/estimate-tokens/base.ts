/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
/**
 * Estimates the number of tokens in a given text using a rough heuristic based on Byte Pair Encoding (BPE) as used in LLMs like GPT.
 * This is not precise and does not use any external API; it's a simple approximation.
 * Considerations:
 * - For English and code (mostly ASCII): Approximately 1 token per 4 characters.
 * - For Chinese/Japanese/Korean characters: Approximately 1 token per 1-2 characters, as hanzi are often single tokens.
 * - For Arabic: Approximately 1 token per 2-3 characters, accounting for script complexity.
 * - Mixed text: Processes character by character, categorizing based on Unicode ranges and averaging contributions.
 * - Punctuation and spaces: Treated similarly to English for simplicity.
 * - This is a rough estimate; actual token count can vary based on the specific tokenizer (e.g., GPT-3/4 uses cl100k_base or similar).
 *
 * @param text A string, or an array of strings that are estimated as one single text
 * @param min The estimated result is never less than it (when it is a non-negative number)
 * @param max The estimated result is never greater than it (when it is a non-negative number)
 */
export function estimateTokensV1(
  text: string | ReadonlyArray<string | undefined | null>,
  min?: number | null,
  max?: number | null
): number {
  if (!text) return inRange(0, min, max);
  if (Array.isArray(text)) {
    // The items are joined by a line break to avoid counting the constant overhead for each of them
    return estimateTokensV1(text.filter((it): it is string => typeof it === "string").join("\n"), min, max);
  }

  let charCount = 0;
  let tokenEstimate = 0;

  for (const char of text as string) {
    const code = char.codePointAt(0)!;

    // ASCII range (English, code, punctuation): assume ~4 chars per token
    if (code < 128) {
      charCount++;
      if (charCount === 4) {
        tokenEstimate++;
        charCount = 0;
      }
    } else if (isCJK(code)) {
      // CJK characters (Chinese, Japanese, Korean): assume ~2 chars per token (conservative for Chinese)
      tokenEstimate += 0.5; // Roughly 1 token per 2 chars
    } else {
      // Other characters (e.g., other languages, emojis): default to ~3 chars per token
      tokenEstimate += 1 / 3;
    }
  }

  // Account for any remaining ASCII chars
  if (charCount > 0) {
    tokenEstimate++;
  }

  // Add a small overhead for potential merges or special tokens (e.g., +1-2 tokens for BOS/EOS in LLMs)
  tokenEstimate += 2;

  // Round up to nearest integer for conservative estimate
  return inRange(Math.ceil(tokenEstimate), min, max);
}

/**
 * Checks whether the code point belongs to the CJK scripts, which are usually tokenized into
 * one token per one or two characters.
 */
function isCJK(code: number) {
  return (
    (code >= 0x3040 && code <= 0x30ff) || // Hiragana and Katakana
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Unified Ideographs Extension A
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
    (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
    (code >= 0x20000 && code <= 0x3ffff) // CJK Unified Ideographs Extension B and above
  );
}

/** Limits `val` into the range `[min, max]`. A negative or non-numeric bound is ignored. */
function inRange(val: number, min?: number | null, max?: number | null) {
  if (typeof min === "number" && min >= 0) val = Math.max(val, min);
  if (typeof max === "number" && max >= 0) val = Math.min(val, max);
  return val;
}
