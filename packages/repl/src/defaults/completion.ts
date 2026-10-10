/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { readdirSync } from "fs";
import { resolve } from "path";
import type { CompletionResult } from "../types.js";

export type CompletePathOptions = {
  dirOnly?: boolean;
  dotFiles?: boolean;
  recursive?: boolean;
};

export function completePath(input?: string, cwd?: string, opts?: CompletePathOptions): Required<CompletionResult> {
  if (!cwd) cwd = process.cwd();
  if (!input) input = "";
  let completeParent = false;
  let matched = input;
  const result: string[] = [];
  const i = input.lastIndexOf("/");
  if (i >= 0) {
    matched = input.slice(i + 1);
    cwd = resolve(cwd, input.slice(0, i));
  } else {
    completeParent = true;
  }
  let dirOnly = false;
  let dotFiles = true;
  let exact = "";
  if (opts) {
    if (typeof opts.dirOnly === "boolean") dirOnly = opts.dirOnly;
    if (typeof opts.dotFiles === "boolean") dotFiles = opts.dotFiles;
    if (opts.recursive === false) exact = " ";
  }
  const lc = matched.toLowerCase();
  try {
    const items = readdirSync(cwd, { withFileTypes: true });
    for (const item of items) {
      if (dirOnly && !item.isDirectory()) continue;
      if (!dotFiles && item.name.startsWith(".")) continue;
      if (matched && !item.name.toLowerCase().startsWith(lc)) continue;
      result.push(item.name + exact);
    }
  } catch {
    // noop
  }
  if (completeParent && /^\.{1,2}$/.test(matched)) result.unshift(".." + exact);
  return { result, matched };
}

export function completeKeyword(str: string, keywords: string[]): CompletionResult {
  const result: string[] = [];
  const lc = str.toLowerCase();
  for (const key of keywords) {
    if (!key.toLowerCase().startsWith(lc)) continue;
    result.push(`${key} `);
  }
  return { result };
}
