/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

/**
 * Enum for character display widths.
 */
const enum CharWidth {
  ZERO = 0,
  HALF = 1,
  FULL = 2,
}

/**
 * Constants for width calculation.
 */
const WIDTH_CONSTANTS = {
  // Matches Emoji sequences, including Zero Width Joiners (ZWJ) and modifiers.
  // We prioritize long sequences (Emoji + ZWJ + Emoji) to count them as 1 unit of width (2 columns).
  // \p{Emoji_Presentation}: Emojis that render as colorful images by default.
  // \p{Emoji}\uFE0F: Emojis forced to render as image.
  // \u200d: Zero Width Joiner.
  REGEX_EMOJI_SEQUENCE: /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200d\p{Emoji})*|./gu,
} as const;

/**
 * Checks if a specific unicode code point represents a full-width character (CJK).
 * * Logic based on standard East Asian Width definitions.
 * * @param {number} codePoint - The unicode code point of the character.
 * @returns {boolean} True if the character is considered full-width.
 */
function isFullWidthCodePoint(codePoint: number): boolean {
  // ASCII / Basic Latin is always half-width (1)
  if (codePoint <= 0x7f) {
    return false;
  }

  // Specific ranges for CJK (Chinese, Japanese, Korean) and Fullwidth forms.
  // These ranges cover the most common full-width characters.
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) || // Hangul Jamo
    (codePoint >= 0x2329 && codePoint <= 0x232a) || // CJK Angle Brackets
    (codePoint >= 0x2e80 && codePoint <= 0x303e) || // CJK Radicals / Punctuation
    (codePoint >= 0x3040 && codePoint <= 0xa4cf) || // Hiragana, Katakana, CJK Ideographs, Yi
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) || // Hangul Syllables
    (codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK Compatibility Ideographs
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) || // Vertical Forms
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) || // CJK Compatibility Forms
    (codePoint >= 0xff00 && codePoint <= 0xff60) || // Fullwidth Forms
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) // Fullwidth Symbols
  );
}

/**
 * Calculates the visual display width of a string.
 * * - Emojis (including complex sequences like 👨‍👩‍👧‍👦) count as 2.
 * - CJK characters count as 2.
 * - Standard ASCII/Latin characters count as 1.
 * - Combining marks / zero-width characters are effectively handled by the regex grouping or treated as 0 via custom logic if strictly needed (simplified here to 1 for non-special chars).
 * * @param {string} str - The input string to measure.
 * @returns {number} The total visual width (column count).
 */
export function getStringVisualWidth(str: string): number {
  if (!str) return 0;

  let totalWidth = 0;

  // Create a strict regex instance to avoid stateful issues with 'g' flag across calls if defined globally without reset
  const regex = new RegExp(WIDTH_CONSTANTS.REGEX_EMOJI_SEQUENCE);

  const matches = str.match(regex);

  if (!matches) return 0;

  for (const segment of matches) {
    // 1. Check if the segment is an Emoji Sequence
    // We test specifically against the Emoji Presentation pattern again or checking string length vs code points
    // A simple heuristic: If it matches the specific emoji property and is not a simple digit/symbol accidentally caught.
    if (/\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u.test(segment)) {
      totalWidth += CharWidth.FULL;
      continue;
    }

    // 2. Fallback: Iterate over code points in this segment (usually just 1 character if not an emoji sequence)
    // Note: 'segment' here is from the fallback |.| part of the regex, so it is a single grapheme/char.
    for (const char of segment) {
      const codePoint = char.codePointAt(0);

      if (codePoint === undefined) continue;

      if (isFullWidthCodePoint(codePoint)) {
        totalWidth += CharWidth.FULL;
      } else {
        // Optimization: Skip Zero Width characters (like \u200b) if necessary,
        // but usually standard chars are width 1.
        totalWidth += CharWidth.HALF;
      }
    }
  }

  return totalWidth;
}
