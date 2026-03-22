/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export function readJSONLines<T = unknown>(
  content: string,
  printErrors?: boolean
): {
  lines: T[];
  errors?: string[];
} {
  const lines = content.split(/\n+/);
  const result: T[] = [];
  const errors: string[] = [];

  for (let line of lines) {
    if (line.length <= 1) continue;
    if (line[0] !== "[" && line[0] !== "{") continue;
    if (line.endsWith(",")) line = line.slice(0, -1);

    try {
      result.push(JSON.parse(line));
    } catch {
      if (printErrors) console.error(`Error: Invalid JSON line ${JSON.stringify(line)}`);
      errors.push(line);
      continue;
    }
  }

  return { lines: result, errors };
}
