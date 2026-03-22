/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

/**
 * ``` typescript
 * eq(
 *  splitShellArgs(`echo "I'm Mike (\"alias name\")" 'quote"'`) ===
 *  ["echo", "I'm Mike (\"alias name\")", "quote\""]
 * )
 * ```
 */
export function splitShellArgs(cmd: string): string[] {
  const args: string[] = [];
  let current: string[] | undefined;
  let quote: "" | "'" | '"' = "";
  let escaped: string | undefined;

  for (let i = 0; i < cmd.length; i++) {
    const char = cmd[i];
    if (escaped) {
      if (!current) current = [];
      current.push(char);

      escaped = undefined;
      continue;
    }

    if (char === "\\" && (quote === '"' || quote === "")) {
      escaped = char;
      continue;
    }

    if (char === " " && quote === "") {
      if (current) args.push(current.join(""));
      current = undefined;
      continue;
    }

    if ((char === "'" || char === '"') && quote === "") {
      quote = char;
      current = [];
      continue;
    }

    if (char === quote) {
      quote = "";

      if (current) args.push(current.join(""));
      current = undefined;
      continue;
    }

    if (!current) current = [];
    current.push(char);
  }

  if (escaped) {
    // incomplete escape seq
    if (!current) current = [];
    current.push("\\");
  }

  if (current) args.push(current.join(""));

  return args;
}
