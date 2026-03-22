/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { COLORS_256, NOOP_COLORS_256, type Colors256 } from "./256.js";
import { BASIC_COLORS, NOOP_COLORS, type BasicColors } from "./base.js";

export type ColorsAll = Colors256 & Omit<BasicColors, keyof Colors256>;

export const COLORS_ALL = {
  ...BASIC_COLORS,
  ...COLORS_256,
} satisfies Readonly<ColorsAll>;

export const NOOP_COLORS_ALL = {
  ...NOOP_COLORS,
  ...NOOP_COLORS_256,
} satisfies Readonly<ColorsAll>;
