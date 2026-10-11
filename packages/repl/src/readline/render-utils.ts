/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { clearScreenDown, cursorTo, moveCursor, type Interface } from "node:readline";

/**
 * Readline retains rows from the previous prompt even after a mode change.
 * Note: `prevRows` is an undocumented internal property of `readline.Interface`;
 * this module is the only place allowed to access it.
 */
export function resetRenderedRows(rl: Interface): void {
  (rl as Interface & { prevRows?: number }).prevRows = 0;
}

/**
 * Clears the whole rendered prompt and input (including multiline prompts and wrapped rows)
 * and leaves the cursor at the start of the first prompt row.
 */
export function clearRenderedInput(rl: Interface, output: NodeJS.WritableStream): void {
  moveCursor(output, 0, -rl.getCursorPos().rows);
  cursorTo(output, 0);
  clearScreenDown(output);
  resetRenderedRows(rl);
}
