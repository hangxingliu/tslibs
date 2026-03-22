/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

/// https://hexdocs.pm/color_palette/ansi_color_codes.html
/// https://www.ditig.com/256-colors-cheat-sheet
export type Colors256 = { [key in keyof typeof COLORS_256]: string };

export const COLORS_256 = {
  /** #eeeeee */
  GRAY_LIGHT2: "\x1b[38;5;255m",
  /** #eeeeee */
  GRAY_LIGHT2_BG: "\x1b[48;5;255m",

  /** #bcbcbc */
  GRAY_LIGHT: "\x1b[38;5;250m",
  /** #bcbcbc */
  GRAY_LIGHT_BG: "\x1b[48;5;250m",

  /** #808080 */
  GRAY: "\x1b[38;5;244m",
  /** #808080 */
  GRAY_BG: "\x1b[48;5;244m",

  /** #3a3a3a */
  GRAY_DARK: "\x1b[38;5;237m",
  /** #3a3a3a */
  GRAY_DARK_BG: "\x1b[48;5;237m",

  /** #121212 */
  GRAY_DARK2: "\x1b[38;5;233m",
  /** #121212 */
  GRAY_DARK2_BG: "\x1b[48;5;233m",

  /** #ffaf5f */
  ORANGE_LIGHT2: "\x1b[38;5;215m",
  /** #ffaf5f */
  ORANGE_LIGHT2_BG: "\x1b[48;5;215m",

  /** #ffaf00 */
  ORANGE_LIGHT: "\x1b[38;5;214m",
  /** #ffaf00 */
  ORANGE_LIGHT_BG: "\x1b[48;5;214m",

  /** #ff8700 */
  ORANGE: "\x1b[38;5;208m",
  /** #ff8700 */
  ORANGE_BG: "\x1b[48;5;208m",

  /** #ff5f00 */
  ORANGE_DARK: "\x1b[38;5;202m",
  /** #ff5f00 */
  ORANGE_DARK_BG: "\x1b[48;5;202m",

  /** #d75f00 */
  ORANGE_DARK2: "\x1b[38;5;166m",
  /** #d75f00 */
  ORANGE_DARK2_BG: "\x1b[48;5;166m",

  /** #ffd7ff */
  PINK_LIGHT2: "\x1b[38;5;225m",
  /** #ffd7ff */
  PINK_LIGHT2_BG: "\x1b[48;5;225m",

  /** #ff87d7 */
  PINK_LIGHT: "\x1b[38;5;212m",
  /** #ff87d7 */
  PINK_LIGHT_BG: "\x1b[48;5;212m",

  /** #ff5fd7 */
  PINK: "\x1b[38;5;206m",
  /** #ff5fd7 */
  PINK_BG: "\x1b[48;5;206m",

  /** #ff00af */
  PINK_DARK: "\x1b[38;5;199m",
  /** #ff00af */
  PINK_DARK_BG: "\x1b[48;5;199m",

  /** #d70087 */
  PINK_DARK2: "\x1b[38;5;162m",
  /** #d70087 */
  PINK_DARK2_BG: "\x1b[48;5;162m",

  /** #afd7ff */
  BLUE_LIGHT2: "\x1b[38;5;153m",
  /** #afd7ff */
  BLUE_LIGHT2_BG: "\x1b[48;5;153m",

  /** #5fd7ff */
  BLUE_LIGHT: "\x1b[38;5;81m",
  /** #5fd7ff */
  BLUE_LIGHT_BG: "\x1b[48;5;81m",

  /** #00d7ff */
  BLUE: "\x1b[38;5;45m",
  /** #00d7ff */
  BLUE_BG: "\x1b[48;5;45m",

  /** #005fd7 */
  BLUE_DARK: "\x1b[38;5;26m",
  /** #005fd7 */
  BLUE_DARK_BG: "\x1b[48;5;26m",

  /** #000087 */
  BLUE_DARK2: "\x1b[38;5;18m",
  /** #000087 */
  BLUE_DARK2_BG: "\x1b[48;5;18m",

  /** #afffff */
  CYAN_LIGHT2: "\x1b[38;5;159m",
  /** #afffff */
  CYAN_LIGHT2_BG: "\x1b[48;5;159m",

  /** #87ffff */
  CYAN_LIGHT: "\x1b[38;5;123m",
  /** #87ffff */
  CYAN_LIGHT_BG: "\x1b[48;5;123m",

  /** #00ffff */
  CYAN: "\x1b[38;5;51m",
  /** #00ffff */
  CYAN_BG: "\x1b[48;5;51m",

  /** #00afaf */
  CYAN_DARK: "\x1b[38;5;37m",
  /** #00afaf */
  CYAN_DARK_BG: "\x1b[48;5;37m",

  /** #008787 */
  CYAN_DARK2: "\x1b[38;5;30m",
  /** #008787 */
  CYAN_DARK2_BG: "\x1b[48;5;30m",

  /** #ff8787 */
  RED_LIGHT2: "\x1b[38;5;210m",
  /** #ff8787 */
  RED_LIGHT2_BG: "\x1b[48;5;210m",

  /** #ff5f87 */
  RED_LIGHT: "\x1b[38;5;204m",
  /** #ff5f87 */
  RED_LIGHT_BG: "\x1b[48;5;204m",

  /** #ff0000 */
  RED: "\x1b[38;5;196m",
  /** #ff0000 */
  RED_BG: "\x1b[48;5;196m",

  /** #af0000 */
  RED_DARK: "\x1b[38;5;124m",
  /** #af0000 */
  RED_DARK_BG: "\x1b[48;5;124m",

  /** #870000 */
  RED_DARK2: "\x1b[38;5;88m",
  /** #870000 */
  RED_DARK2_BG: "\x1b[48;5;88m",

  /** #d7ffd7 */
  GREEN_LIGHT2: "\x1b[38;5;194m",
  /** #d7ffd7 */
  GREEN_LIGHT2_BG: "\x1b[48;5;194m",

  /** #afff87 */
  GREEN_LIGHT: "\x1b[38;5;156m",
  /** #afff87 */
  GREEN_LIGHT_BG: "\x1b[48;5;156m",

  /** #87ff00 */
  GREEN: "\x1b[38;5;118m",
  /** #87ff00 */
  GREEN_BG: "\x1b[48;5;118m",

  /** #008700 */
  GREEN_DARK: "\x1b[38;5;28m",
  /** #008700 */
  GREEN_DARK_BG: "\x1b[48;5;28m",

  /** #005f00 */
  GREEN_DARK2: "\x1b[38;5;22m",
  /** #005f00 */
  GREEN_DARK2_BG: "\x1b[48;5;22m",

  /** #d7afff */
  PURPLE_LIGHT2: "\x1b[38;5;183m",
  /** #d7afff */
  PURPLE_LIGHT2_BG: "\x1b[48;5;183m",

  /** #af87d7 */
  PURPLE_LIGHT: "\x1b[38;5;140m",
  /** #af87d7 */
  PURPLE_LIGHT_BG: "\x1b[48;5;140m",

  /** #8700af */
  PURPLE: "\x1b[38;5;91m",
  /** #8700af */
  PURPLE_BG: "\x1b[48;5;91m",

  /** #5f005f */
  PURPLE_DARK: "\x1b[38;5;53m",
  /** #5f005f */
  PURPLE_DARK_BG: "\x1b[48;5;53m",

  /** #ffffaf */
  YELLOW_LIGHT2: "\x1b[38;5;229m",
  /** #ffffaf */
  YELLOW_LIGHT2_BG: "\x1b[48;5;229m",

  /** #ffff87 */
  YELLOW_LIGHT: "\x1b[38;5;228m",
  /** #ffff87 */
  YELLOW_LIGHT_BG: "\x1b[48;5;228m",

  /** #ffff00 */
  YELLOW: "\x1b[38;5;226m",
  /** #ffff00 */
  YELLOW_BG: "\x1b[48;5;226m",

  /** #5fd7d7 */
  TEAL_LIGHT2: "\x1b[38;5;80m",
  /** #5fd7d7 */
  TEAL_LIGHT2_BG: "\x1b[48;5;80m",

  /** #00afaf (tiffany) */
  TEAL_LIGHT: "\x1b[38;5;37m",
  /** #00afaf (tiffany) */
  TEAL_LIGHT_BG: "\x1b[48;5;37m",

  /** #008787 */
  TEAL: "\x1b[38;5;30m",
  /** #008787 */
  TEAL_BG: "\x1b[48;5;30m",

  /** #d7ff5f */
  GREEN_YELLOW: "\x1b[38;5;191m",
  /** #d7ff5f */
  GREEN_YELLOW_BG: "\x1b[48;5;191m",

  /** #875f00 */
  BROWN: "\x1b[38;5;94m",
  /** #875f00 */
  BROWN_BG: "\x1b[48;5;94m",

  /** #ffd700 */
  GLOD: "\x1b[38;5;220m",
  /** #ffd700 */
  GLOD_BG: "\x1b[48;5;220m",

  /** #ffffff */
  WHITE: "\x1b[38;5;231m",
  /** #ffffff */
  WHITE_BG: "\x1b[48;5;231m",

  /** #000000 */
  BLACK: "\x1b[38;5;16m",
  /** #000000 */
  BLACK_BG: "\x1b[48;5;16m",
} as const;

/** {@link COLORS_256} */
export const NOOP_COLORS_256 = {
  /** #eeeeee */
  GRAY_LIGHT2: "",
  /** #eeeeee */
  GRAY_LIGHT2_BG: "",

  /** #bcbcbc */
  GRAY_LIGHT: "",
  /** #bcbcbc */
  GRAY_LIGHT_BG: "",

  /** #808080 */
  GRAY: "",
  /** #808080 */
  GRAY_BG: "",

  /** #3a3a3a */
  GRAY_DARK: "",
  /** #3a3a3a */
  GRAY_DARK_BG: "",

  /** #121212 */
  GRAY_DARK2: "",
  /** #121212 */
  GRAY_DARK2_BG: "",

  /** #ffaf5f */
  ORANGE_LIGHT2: "",
  /** #ffaf5f */
  ORANGE_LIGHT2_BG: "",

  /** #ffaf00 */
  ORANGE_LIGHT: "",
  /** #ffaf00 */
  ORANGE_LIGHT_BG: "",

  /** #ff8700 */
  ORANGE: "",
  /** #ff8700 */
  ORANGE_BG: "",

  /** #ff5f00 */
  ORANGE_DARK: "",
  /** #ff5f00 */
  ORANGE_DARK_BG: "",

  /** #d75f00 */
  ORANGE_DARK2: "",
  /** #d75f00 */
  ORANGE_DARK2_BG: "",

  /** #ffd7ff */
  PINK_LIGHT2: "",
  /** #ffd7ff */
  PINK_LIGHT2_BG: "",

  /** #ff87d7 */
  PINK_LIGHT: "",
  /** #ff87d7 */
  PINK_LIGHT_BG: "",

  /** #ff5fd7 */
  PINK: "",
  /** #ff5fd7 */
  PINK_BG: "",

  /** #ff00af */
  PINK_DARK: "",
  /** #ff00af */
  PINK_DARK_BG: "",

  /** #d70087 */
  PINK_DARK2: "",
  /** #d70087 */
  PINK_DARK2_BG: "",

  /** #afd7ff */
  BLUE_LIGHT2: "",
  /** #afd7ff */
  BLUE_LIGHT2_BG: "",

  /** #5fd7ff */
  BLUE_LIGHT: "",
  /** #5fd7ff */
  BLUE_LIGHT_BG: "",

  /** #00d7ff */
  BLUE: "",
  /** #00d7ff */
  BLUE_BG: "",

  /** #005fd7 */
  BLUE_DARK: "",
  /** #005fd7 */
  BLUE_DARK_BG: "",

  /** #000087 */
  BLUE_DARK2: "",
  /** #000087 */
  BLUE_DARK2_BG: "",

  /** #afffff */
  CYAN_LIGHT2: "",
  /** #afffff */
  CYAN_LIGHT2_BG: "",

  /** #87ffff */
  CYAN_LIGHT: "",
  /** #87ffff */
  CYAN_LIGHT_BG: "",

  /** #00ffff */
  CYAN: "",
  /** #00ffff */
  CYAN_BG: "",

  /** #00afaf */
  CYAN_DARK: "",
  /** #00afaf */
  CYAN_DARK_BG: "",

  /** #008787 */
  CYAN_DARK2: "",
  /** #008787 */
  CYAN_DARK2_BG: "",

  /** #ff8787 */
  RED_LIGHT2: "",
  /** #ff8787 */
  RED_LIGHT2_BG: "",

  /** #ff5f87 */
  RED_LIGHT: "",
  /** #ff5f87 */
  RED_LIGHT_BG: "",

  /** #ff0000 */
  RED: "",
  /** #ff0000 */
  RED_BG: "",

  /** #af0000 */
  RED_DARK: "",
  /** #af0000 */
  RED_DARK_BG: "",

  /** #870000 */
  RED_DARK2: "",
  /** #870000 */
  RED_DARK2_BG: "",

  /** #d7ffd7 */
  GREEN_LIGHT2: "",
  /** #d7ffd7 */
  GREEN_LIGHT2_BG: "",

  /** #afff87 */
  GREEN_LIGHT: "",
  /** #afff87 */
  GREEN_LIGHT_BG: "",

  /** #87ff00 */
  GREEN: "",
  /** #87ff00 */
  GREEN_BG: "",

  /** #008700 */
  GREEN_DARK: "",
  /** #008700 */
  GREEN_DARK_BG: "",

  /** #005f00 */
  GREEN_DARK2: "",
  /** #005f00 */
  GREEN_DARK2_BG: "",

  /** #d7afff */
  PURPLE_LIGHT2: "",
  /** #d7afff */
  PURPLE_LIGHT2_BG: "",

  /** #af87d7 */
  PURPLE_LIGHT: "",
  /** #af87d7 */
  PURPLE_LIGHT_BG: "",

  /** #8700af */
  PURPLE: "",
  /** #8700af */
  PURPLE_BG: "",

  /** #5f005f */
  PURPLE_DARK: "",
  /** #5f005f */
  PURPLE_DARK_BG: "",

  /** #ffffaf */
  YELLOW_LIGHT2: "",
  /** #ffffaf */
  YELLOW_LIGHT2_BG: "",

  /** #ffff87 */
  YELLOW_LIGHT: "",
  /** #ffff87 */
  YELLOW_LIGHT_BG: "",

  /** #ffff00 */
  YELLOW: "",
  /** #ffff00 */
  YELLOW_BG: "",

  /** #5fd7d7 */
  TEAL_LIGHT2: "",
  /** #5fd7d7 */
  TEAL_LIGHT2_BG: "",

  /** #00afaf (tiffany) */
  TEAL_LIGHT: "",
  /** #00afaf (tiffany) */
  TEAL_LIGHT_BG: "",

  /** #008787 */
  TEAL: "",
  /** #008787 */
  TEAL_BG: "",

  /** #d7ff5f */
  GREEN_YELLOW: "",
  /** #d7ff5f */
  GREEN_YELLOW_BG: "",

  /** #875f00 */
  BROWN: "",
  /** #875f00 */
  BROWN_BG: "",

  /** #ffd700 */
  GLOD: "",
  /** #ffd700 */
  GLOD_BG: "",

  /** #ffffff */
  WHITE: "",
  /** #ffffff */
  WHITE_BG: "",

  /** #000000 */
  BLACK: "",
  /** #000000 */
  BLACK_BG: "",
} satisfies Readonly<Colors256>;
