/**
 * @see https://github.com/chalk/ansi-regex/blob/main/index.js
 *
 * last sync: <https://github.com/chalk/ansi-regex/commit/72bc570aaf25fca25541b49c6a8564f3ec63e835>
 */
export function getAnsiRegexExpr() {
  // Valid string terminator sequences are BEL, ESC\, and 0x9c
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";

  // OSC sequences only: ESC ] ... ST (non-greedy until the first ST)
  const osc = `(?:\\u001B\\][\\s\\S]*?${ST})`;

  // CSI and related: ESC/C1, optional intermediates, optional params (supports ; and :) then final byte
  const csi = "[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]";

  const pattern = `${osc}|${csi}`;
  return pattern;
}

export const ANSI_REGEXP = new RegExp(getAnsiRegexExpr(), "");

export const ANSI_REGEXP_ALL = new RegExp(getAnsiRegexExpr(), "g");
