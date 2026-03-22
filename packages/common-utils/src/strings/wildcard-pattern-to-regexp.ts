/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

/**
 * Converts a wildcard pattern to a regular expression.
 *
 * Supports '*' for zero or more characters, '?' for a single character,
 * and character classes like '[a-z]'. Escapes special regex characters.
 *
 * @param pattern The wildcard pattern string to convert.
 * @param matchWhole If true, the regex will match the entire string (adds ^ and $ anchors). Defaults to false.
 * @param caseSensitive If true, the regex will be case-sensitive. Defaults to false (case-insensitive).
 * @returns A RegExp object based on the pattern.
 */
export function wildcardPatternToRegex(pattern: string, matchWhole = false, caseSensitive = false): RegExp {
  let regexStr = matchWhole ? "^" : ""; // Start anchor for full match
  let i = 0;
  let pending: [min: number, max?: number] | undefined;
  const consumePending = () => {
    if (!pending) return;
    regexStr += ".";
    const [p0, p1] = pending;
    if (!p1) {
      if (p0 === 0) regexStr += "*";
      else if (p0 === 1) regexStr += "+";
      else regexStr += `{${p0},}`;
    } else {
      if (p0 === p1) regexStr += `{${p0}}`;
      else regexStr += `{${p0},${p1}}`;
    }
    pending = undefined;
  };

  while (i < pattern.length) {
    const ch = pattern[i++];
    if (ch === "*") {
      if (!pending) pending = [0];
      else delete pending[1];
      continue;
    }

    if (ch === "?") {
      if (!pending) {
        pending = [1, 1];
      } else {
        if (pending[1]) pending[1]++;
        pending[0]++;
      }
      continue;
    }

    consumePending();
    if (ch === "[") {
      // Handle character class: copy '[' and content until ']'
      let subStr = ch;
      let j = i;
      for (; j < pattern.length; j++) {
        if (pattern[j] === "]") {
          regexStr += subStr + pattern[j];
          i = j + 1;
          break;
        }
        if (pattern[i] === "[") {
          regexStr += escapeRegexChar(ch);
          break;
        }
        subStr += pattern[j];
      }
      if (j >= pattern.length) regexStr += escapeRegexChar(ch);
      continue;
    }

    // Escape any other special regex characters
    regexStr += escapeRegexChar(ch);
  }

  consumePending();
  regexStr += matchWhole ? "$" : ""; // End anchor for full match
  return new RegExp(regexStr, caseSensitive ? "" : "i");
}

/**
 * Escapes a single character if it is a special regex character.
 *
 * @param ch The single character to escape.
 * @returns The escaped character if special, otherwise the character itself.
 */
function escapeRegexChar(ch: string): string {
  // Regex special characters that need escaping
  const specialChars = /[.*+?^${}()|[\]\\]/g;
  return ch.replace(specialChars, "\\$&");
}
