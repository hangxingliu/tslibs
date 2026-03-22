/**
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code
 */
export const CSI = "\x1b[";

export const SAVE_CURSOR = "\x1b[s";
export const RESTORE_CURSOR = "\x1b[u";
export const MOVE_CURSOR = (row = 1, column = 1) => `\x1b[${row};${column}H`;
export const PREV_LINE = (n = 1) => `\x1b[${n}F`;
