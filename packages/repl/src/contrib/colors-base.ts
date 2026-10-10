/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export type BasicColors = { [key in keyof typeof BASIC_COLORS]: string };

export const BASIC_COLORS = {
  BOLD: "\x1b[1m",
  DIM: "\x1b[2m",
  ITALIC: "\x1b[3m",
  UNDERLINE: "\x1b[4m",
  BLINK: "\x1b[5m",
  REVERSE: "\x1b[7m",
  HIDDEN: "\x1b[8m",
  //
  RESET: "\x1b[0m",
  RESET_BOLD: "\x1b[21m",
  RESET_DIM: "\x1b[22m",
  RESET_ITALIC: "\x1b[23m",
  RESET_UNDERLINE: "\x1b[24m",
  RESET_BLINK: "\x1b[25m",
  RESET_REVERSE: "\x1b[27m",
  RESET_HIDDEN: "\x1b[28m",
  //
  RESET_FG: "\x1b[39m",
  RESET_BG: "\x1b[49m",
  //
  BLACK: "\x1b[30m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  GRAY_LIGHT: "\x1b[37m",
  //
  GRAY: "\x1b[90m",
  RED_LIGHT: "\x1b[91m",
  GREEN_LIGHT: "\x1b[92m",
  YELLOW_LIGHT: "\x1b[93m",
  BLUE_LIGHT: "\x1b[94m",
  MAGENTA_LIGHT: "\x1b[95m",
  CYAN_LIGHT: "\x1b[96m",
  WHITE: "\x1b[97m",
  //
  BLACK_BG: "\x1b[40m",
  RED_BG: "\x1b[41m",
  GREEN_BG: "\x1b[42m",
  YELLOW_BG: "\x1b[43m",
  BLUE_BG: "\x1b[44m",
  MAGENTA_BG: "\x1b[45m",
  CYAN_BG: "\x1b[46m",
  GRAY_LIGHT_BG: "\x1b[47m",
  //
  GRAY_BG: "\x1b[100m",
  RED_LIGHT_BG: "\x1b[101m",
  GREEN_LIGHT_BG: "\x1b[102m",
  YELLOW_LIGHT_BG: "\x1b[103m",
  BLUE_LIGHT_BG: "\x1b[104m",
  MAGENTA_LIGHT_BG: "\x1b[105m",
  CYAN_LIGHT_BG: "\x1b[106m",
  WHITE_BG: "\x1b[107m",
} as const;

/** {@link BASIC_COLORS} */
export const NOOP_COLORS = {
  BOLD: "",
  DIM: "",
  ITALIC: "",
  UNDERLINE: "",
  BLINK: "",
  REVERSE: "",
  HIDDEN: "",
  //
  RESET: "",
  RESET_BOLD: "",
  RESET_DIM: "",
  RESET_ITALIC: "",
  RESET_UNDERLINE: "",
  RESET_BLINK: "",
  RESET_REVERSE: "",
  RESET_HIDDEN: "",
  //
  RESET_FG: "",
  RESET_BG: "",
  //
  BLACK: "",
  RED: "",
  GREEN: "",
  YELLOW: "",
  BLUE: "",
  MAGENTA: "",
  CYAN: "",
  GRAY_LIGHT: "",
  //
  GRAY: "",
  RED_LIGHT: "",
  GREEN_LIGHT: "",
  YELLOW_LIGHT: "",
  BLUE_LIGHT: "",
  MAGENTA_LIGHT: "",
  CYAN_LIGHT: "",
  WHITE: "",
  //
  BLACK_BG: "",
  RED_BG: "",
  GREEN_BG: "",
  YELLOW_BG: "",
  BLUE_BG: "",
  MAGENTA_BG: "",
  CYAN_BG: "",
  GRAY_LIGHT_BG: "",
  //
  GRAY_BG: "",
  RED_LIGHT_BG: "",
  GREEN_LIGHT_BG: "",
  YELLOW_LIGHT_BG: "",
  BLUE_LIGHT_BG: "",
  MAGENTA_LIGHT_BG: "",
  CYAN_LIGHT_BG: "",
  WHITE_BG: "",
} satisfies Readonly<BasicColors>;
