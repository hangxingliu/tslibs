import { describe, it } from "bun:test";
import { deepStrictEqual } from "assert";
import type { Arg, ArgRange, ArgQuote } from "../index.js";
import { CommandArgsTokenizer, CommandArgs } from "../index.js";

type TestCase = [input: string, ...args: Arg[]];

const r = (from: number, to: number, text: string, quote?: ArgQuote) => {
  const range: ArgRange = { from, to, text };
  if (quote) range.quote = quote;
  return range;
};

const simpleTests: TestCase[] = [
  [""],
  [" "],
  [
    "a b  c",
    { ...r(0, 1, "a"), range: [r(0, 1, "a")] },
    { ...r(2, 3, "b"), range: [r(2, 3, "b")] },
    { ...r(5, 6, "c"), range: [r(5, 6, "c")] },
  ],
  ["a     ", { ...r(0, 1, "a"), range: [r(0, 1, "a")] }],
  ["i'm  ", { ...r(0, 3, "i'm"), range: [r(0, 3, "i'm")] }],
];

const unixTests: TestCase[] = [
  [""],
  [" "],
  ["''", { ...r(0, 2, ""), range: [r(1, 1, "", "'")] }],
  ["\\", { ...r(0, 1, "\\"), range: [r(0, 1, "\\")] }],
  ["\\\\", { ...r(0, 2, "\\\\"), range: [r(0, 2, "\\\\")] }],
  ["'\\'", { ...r(0, 3, "\\"), range: [r(1, 2, "\\", "'")] }],
  ["'\\'x", { ...r(0, 4, "\\x"), text: "\\x", range: [r(1, 2, "\\", "'"), r(3, 4, "x")] }],
  ["a b ", { ...r(0, 1, "a"), range: [r(0, 1, "a")] }, { ...r(2, 3, "b"), range: [r(2, 3, "b")] }],
];

describe("tokenizer", function () {
  for (const test of simpleTests) {
    const [input, ...args] = test;
    it(`# simple args ${JSON.stringify(input)}`, function () {
      const parsed = new CommandArgs(input, CommandArgsTokenizer.simple);
      deepStrictEqual(parsed.args, args);
    });
  }

  for (const test of unixTests) {
    const [input, ...args] = test;
    it(`# unix args ${JSON.stringify(input)}`, function () {
      const parsed = new CommandArgs(input, CommandArgsTokenizer.unix);
      deepStrictEqual(parsed.args, args);
    });
  }
});
