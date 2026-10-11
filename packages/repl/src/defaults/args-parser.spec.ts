import { describe, it } from "bun:test";
import { deepStrictEqual } from "node:assert";
import { CommandArgsTokenizer, CommandArgs, DefaultArgsParser } from "../index.js";

describe("completion", function () {
  const args = new DefaultArgsParser({
    options: {
      ro: { short: "r", type: "boolean" },
      name: { type: "string" },
    },
  });

  it(`# completeArgs 1`, function () {
    const r = args.complete(new CommandArgs("", CommandArgsTokenizer.unix));
    deepStrictEqual(r, { result: ["--ro ", "-r ", "--name "] });
  });
  it(`# completeArgs 2`, function () {
    const r = args.complete(new CommandArgs("-", CommandArgsTokenizer.unix));
    deepStrictEqual(r, { result: ["--ro ", "-r ", "--name "] });
  });
  it(`# completeArgs 3`, function () {
    const r = args.complete(new CommandArgs("--", CommandArgsTokenizer.unix));
    deepStrictEqual(r, { result: ["--ro ", "--name "] });
  });
  it(`# completeArgs 4`, function () {
    const r = args.complete(new CommandArgs("-- -", CommandArgsTokenizer.unix));
    deepStrictEqual(r, undefined);
  });
  it(`# completeArgs 5`, function () {
    const r = args.complete(new CommandArgs("--name -", CommandArgsTokenizer.unix));
    deepStrictEqual(r, undefined);
  });
  it(`# completeArgs 6`, function () {
    const r = args.complete(new CommandArgs("--name -- -", CommandArgsTokenizer.unix));
    deepStrictEqual(r, { result: ["--ro ", "-r ", "--name "] });
  });
});
