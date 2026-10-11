import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import type { Mock } from "bun:test";
import { ANSI_REGEXP_ALL } from "../contrib/shell-ansi-regex.js";
import { CommandArgs } from "../tokenizer/index.js";
import { CommandArgsTokenizer } from "../tokenizer/types.js";
import type { CommandMeta, SharedDataBase } from "../types.js";
import { CommandHelp } from "./cmd-help.js";

const METAS: CommandMeta[] = [
  { match: ["help"], usage: ["help [command]"], description: "Print help" },
  { match: ["exit"], usage: ["exit"], description: "Exit" },
];

let logSpy: Mock<typeof console.log>;
beforeEach(() => {
  logSpy = spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => logSpy.mockRestore());

async function runHelp(help: CommandHelp) {
  help.connect({ commandMetas: METAS } as unknown as SharedDataBase);
  await help.onCommand("help", new CommandArgs("", CommandArgsTokenizer.simple));
  return logSpy.mock.calls.map((it) => String(it[0]).replace(ANSI_REGEXP_ALL, "").trimEnd());
}

test("default help separates commands by one blank line without a trailing blank line", async () => {
  const lines = await runHelp(new CommandHelp());
  expect(lines.length).toBe(3);
  expect(lines[1]).toBe("");
  expect(lines[2]).toStartWith("exit");
});

test("compact help has no blank lines", async () => {
  const lines = await runHelp(new CommandHelp({ compact: true, extraHelp: "extra" }));
  expect(lines.length).toBe(3);
  expect(lines[0]).toStartWith("help");
  expect(lines[1]).toStartWith("exit");
  expect(lines[2]).toBe("\nextra");
});

test("string constructor argument is the extra help", () => {
  const help = new CommandHelp("extra");
  expect(help.extraHelp).toBe("extra");
  expect(help.compact).toBe(false);
});
