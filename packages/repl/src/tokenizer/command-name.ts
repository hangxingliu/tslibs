/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
/** Valid strict command names. */
export const REGEXP_CMD = /^[\w-_\?]+$/;

/** Captures the strict command name (group 1) and the whitespace following it (group 2). */
export const REGEXP_CMD_MATCH = /^\s*([\w-_\?]+)(\s*)/;

/** Like {@link REGEXP_CMD_MATCH}, but any non-whitespace characters form the command name. */
export const REGEXP_CMD_LOOSE_MATCH = /^\s*(\S+)(\s*)/;

/**
 * Splits a command line into the command name and the rest of the line (the first line break is removed).
 * @example getCmdName("  ls -l /tmp", false) // => { name: "ls", rest: "-l /tmp" }
 * @example getCmdName("./run a", false) // => undefined
 * @example getCmdName("./run a", true) // => { name: "./run", rest: "a" }
 */
export function getCmdName(line: string, looseMode: boolean) {
  const match = line.match(looseMode ? REGEXP_CMD_LOOSE_MATCH : REGEXP_CMD_MATCH);
  if (!match) return;
  return { name: match[1], rest: line.slice(match[0].length).replace(/\r?\n/, "") };
}
