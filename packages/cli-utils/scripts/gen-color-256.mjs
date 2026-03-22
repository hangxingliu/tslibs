#!/usr/bin/env node
//@ts-check
import { readFileSync, writeFileSync } from "fs";
import { relative, resolve } from "path";
import { format } from "prettier";

const SHOW_COLORS = !process.argv.slice(2).includes("--no-ui");

const TARGET_FILE = resolve(import.meta.dirname, "../src/colors/256.ts");
const PRETTIER_RC_FILE = resolve(import.meta.dirname, "../../../.prettierrc");
const LICENSE_HEADER = resolve(import.meta.dirname, "../../../scripts/licenses/mit.banner.js");

/** @type {import('prettier').Options} */
const PRETTIER_RC = JSON.parse(readFileSync(PRETTIER_RC_FILE, "utf-8"));
PRETTIER_RC.parser = "typescript";

/** @typedef {"light" | "light2" | "main" | "dark" | "dark2"} ColorMode */
/** @typedef {[mode: ColorMode, colorCode: number, hex: `#${string}`]} ColorItem */

/** @type {{ [name: string]: ColorItem[] }} */
const COLORS = {
  gray: [
    ["light2", 255, "#eeeeee"],
    ["light", 250, "#bcbcbc"],
    ["main", 244, "#808080"],
    ["dark", 237, "#3a3a3a"],
    ["dark2", 233, "#121212"],
  ],
  orange: [
    ["light2", 215, "#ffaf5f"],
    ["light", 214, "#ffaf00"],
    ["main", 208, "#ff8700"],
    ["dark", 202, "#ff5f00"],
    ["dark2", 166, "#d75f00"],
  ],
  pink: [
    ["light2", 225, "#ffd7ff"],
    ["light", 212, "#ff87d7"],
    ["main", 206, "#ff5fd7"],
    ["dark", 199, "#ff00af"],
    ["dark2", 162, "#d70087"],
  ],
  blue: [
    ["light2", 153, "#afd7ff"],
    ["light", 81, "#5fd7ff"],
    ["main", 45, "#00d7ff"],
    ["dark", 26, "#005fd7"],
    ["dark2", 18, "#000087"],
  ],
  cyan: [
    ["light2", 159, "#afffff"],
    ["light", 123, "#87ffff"],
    ["main", 51, "#00ffff"],
    ["dark", 37, "#00afaf"],
    ["dark2", 30, "#008787"],
  ],
  red: [
    ["light2", 210, "#ff8787"],
    ["light", 204, "#ff5f87"],
    ["main", 196, "#ff0000"],
    ["dark", 124, "#af0000"],
    ["dark2", 88, "#870000"],
  ],
  green: [
    ["light2", 194, "#d7ffd7"],
    ["light", 156, "#afff87"],
    ["main", 118, "#87ff00"],
    ["dark", 28, "#008700"],
    ["dark2", 22, "#005f00"],
  ],
  purple: [
    ["light2", 183, "#d7afff"],
    ["light", 140, "#af87d7"],
    ["main", 91, "#8700af"],
    ["dark", 53, "#5f005f"],
  ],
  yellow: [
    ["light2", 229, "#ffffaf"],
    ["light", 228, "#ffff87"],
    ["main", 226, "#ffff00"],
  ],
  teal: [
    ["light2", 80, "#5fd7d7"],
    ["light", 37, "#00afaf (tiffany)"],
    ["main", 30, "#008787"],
  ],
  green_yellow: [["main", 191, "#d7ff5f"]],
  brown: [["main", 94, "#875f00"]],
  glod: [["main", 220, "#ffd700"]],
  white: [["main", 231, "#ffffff"]],
  black: [["main", 16, "#000000"]],
};

/** @type {{ [x in ColorMode]: string }} */
const COLOR_MODE_NAME = {
  light2: "L2",
  light: "L",
  main: "MAIN",
  dark: "D",
  dark2: "D2",
};
const BLOCKS5 = "█████";

const code = [
  readFileSync(LICENSE_HEADER, "utf-8"),
  `/// https://hexdocs.pm/color_palette/ansi_color_codes.html`,
  `/// https://www.ditig.com/256-colors-cheat-sheet`,
  `export type Colors256 = { [key in keyof typeof COLORS_256]: string };`,
  ``,
];

/** @type {string[]} */
const fields = [];
const fieldsNoop = [];
for (const [name, colors] of Object.entries(COLORS)) {
  let line0 = "".padStart(14) + " ";
  let line1 = `${name}:`.padStart(14) + " ";
  for (const [colorMode, colorCode, hex] of colors) {
    const modeName = COLOR_MODE_NAME[colorMode];
    line0 += colorMode[0] === "d" ? modeName.padStart(5) : modeName.padEnd(5);
    line1 += `\x1b[38;5;${colorCode}m${BLOCKS5}\x1b[0m`;

    const fieldName = (colorMode === "main" ? name : `${name}_${colorMode}`).toUpperCase();
    fields.push(`  /** ${hex} */`);
    fields.push(`  ${fieldName}: "\\x1b[38;5;${colorCode}m",`);
    fields.push(`  /** ${hex} */`);
    fields.push(`  ${fieldName}_BG: "\\x1b[48;5;${colorCode}m",`);
    fields.push("\n");

    fieldsNoop.push(`  /** ${hex} */`);
    fieldsNoop.push(`  ${fieldName}: "",`);
    fieldsNoop.push(`  /** ${hex} */`);
    fieldsNoop.push(`  ${fieldName}_BG: "",`);
    fieldsNoop.push("\n");
  }
  if (SHOW_COLORS) {
    console.log(line0);
    console.log(line1);
  }
}

code.push(
  `export const COLORS_256 = {`,
  ...fields,
  `} as const;`,
  ``,
  `/** {@link COLORS_256} */`,
  `export const NOOP_COLORS_256 = {`,
  ...fieldsNoop,
  `} satisfies Readonly<Colors256>;`,
  ``
);

format(code.join("\n"), PRETTIER_RC).then((finalCode) => {
  writeFileSync(TARGET_FILE, finalCode);
  console.log(`generated '${relative(process.cwd(), TARGET_FILE)}'`);
});
