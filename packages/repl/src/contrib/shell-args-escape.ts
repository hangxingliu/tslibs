/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

/**
 * Escapes a single shell argument to prevent command injection vulnerabilities.
 *
 * This function is designed for Unix-like shells (e.g., bash), where single quotes are used to enclose arguments containing special characters.
 * It first checks if the argument is "safe" (alphanumeric, underscore, hyphen, or period) to avoid unnecessary quoting.
 * If not, it wraps the argument in single quotes and escapes any internal single quotes by replacing them with '\\'' to prevent premature closure of the quoted string.
 *
 * Note: This escaping method may not be compatible with Windows Command Prompt or PowerShell, which use different quoting rules (e.g., double quotes).
 * For cross-platform compatibility, consider using libraries like shell-quote or platform-specific handling.
 * Always validate or sanitize inputs before passing to shell commands to mitigate risks beyond quoting, such as argument length limits or environment variable interactions.
 *
 * @param arg - The shell argument to escape.
 * @returns The safely escaped argument.
 */
export function escapeShellArg(arg: string) {
  if (/^[\w-\.]+$/.test(arg)) return arg;
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

/**
 * {@link escapeShellArg}
 */
export function escapeShellArgs(args: string[]) {
  return args.map(escapeShellArg).join(" ");
}

/** Mapping of escape sequence characters to their byte values */
const ESCAPE_SEQ = new Map([
  ["a", 0x07], // Bell (alert)
  ["b", 0x08], // Backspace
  ["f", 0x0c], // Form feed
  ["n", 0x0a], // Line feed (newline)
  ["r", 0x0d], // Carriage return
  ["t", 0x09], // Horizontal tab
  ["v", 0x0b], // Vertical tab
  ["'", 0x27], // Single quote
  ['"', 0x22], // Double quote
  ["\\", 0x5c], // Backslash
]);

/**
 * Parses Unix-style escape sequences in a string and returns the decoded bytes.
 * Supports standard escape sequences (\n, \t, etc.), octal sequences (\123),
 * and hexadecimal sequences (\x41).
 *
 * @param str - The input string containing escape sequences
 * @returns A Buffer containing the decoded bytes
 */
export function parseUnixEscapeSeq(str: string): Buffer {
  const buf = Buffer.from(str);
  let bufPtr = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch !== "\\") {
      const count = buf.write(ch, bufPtr);
      bufPtr += count;
      continue;
    }

    let nextCh = str[++i];
    const mtx = ESCAPE_SEQ.get(nextCh);
    if (mtx) {
      buf[bufPtr++] = mtx;
      continue;
    }

    // Handle octal escape sequences (\000 to \377)
    if (/^[0-7]$/.test(nextCh)) {
      let octalValue = parseInt(nextCh, 8);

      // Try to read up to 2 more octal digits
      for (let j = 0; j < 2; j++) {
        nextCh = str[++i];
        if (/^[0-8]$/.test(nextCh)) {
          const newV = octalValue * 8 + parseInt(nextCh, 8);
          if (newV < 255) {
            octalValue = newV;
            continue;
          }
        }
        i--;
        break;
      }
      buf[bufPtr++] = octalValue;
      continue;
    }

    // Handle hexadecimal escape sequences (\x00 to \xFF)
    if (nextCh === "x") {
      nextCh = str[++i];
      if (!/^[0-9a-fA-F]$/.test(nextCh)) {
        i -= 2;
        continue;
      }

      let v = parseInt(nextCh, 16);
      nextCh = str[++i];
      if (/^[0-9a-fA-F]$/.test(nextCh)) {
        v = v * 16 + parseInt(nextCh, 16);
      } else {
        i--;
      }
      buf[bufPtr++] = v;
      continue;
    }

    i--;
  }
  return buf.subarray(0, bufPtr);
}
