/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export type ArgQuote = '"' | "'";

/** `[from, to)` without quotes */
export type ArgRange = {
  text: string;
  from: number;
  to?: number;
  quote?: ArgQuote;
};

/** `[from, to)` **with** quotes */
export type Arg = {
  text: string;
  from: number;
  to?: number;
  range: ArgRange[];
};

export enum CommandArgsTokenizer {
  /** str.split(/\s+/) */
  simple = 0,
  /** unix shell style: '....' and "This is quoted: \" and ' " */
  unix = 1,
}

export type ArgsCompletionContext = {
  index: number;
  str: string;
  arg?: Arg;
};

export type VarCompletionContext = {
  suffix?: "}";
  prefix: "${" | "$";
  varName: string;
};

export enum VarResolverStrategy {
  /** `"$var"`, `"var = ${var} or $var"` and `"${var[0]}"` */
  loose = 1,
  /** `"$var"`, `${var}`, `${var[0]}` */
  full = 2,
}

export type VarResolver = {
  strategy?: VarResolverStrategy;

  get(name: string): any;
  keys(keyword?: string): string[];

  set?(name: string, val?: any): void;
  delete?(name: string): void;
};
