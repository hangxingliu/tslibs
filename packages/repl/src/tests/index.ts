import { dirname, resolve } from "node:path";
//
import { REPL, CommandHelp, CommandExit, CommandSet, CommandArgsTokenizer } from "../index.js";
//
import { SharedData } from "./shared-data.js";
import { CommandCd } from "./cmd-cd.js";
import { CommandLs } from "./cmd-ls.js";
import { CommandPwd } from "./cmd-pwd.js";
import { CommandTimer } from "./cmd-timer.js";
import { CommandEcho } from "./cmd-echo.js";
import { CommandTestArgs } from "./cmd-args.js";
import { CommandLoginServer } from "./cmd-login.js";
import { mkdirSync } from "node:fs";

const DEFAULT_HISTORY_FILE = resolve(import.meta.dirname, "../../tmp/repl-history");
let historyFile = process.env.REPL_HISTORY_FILE;
if (!historyFile) {
  mkdirSync(dirname(DEFAULT_HISTORY_FILE), { recursive: true });
  historyFile = DEFAULT_HISTORY_FILE;
}

const sharedData = new SharedData();
const repl = new REPL(
  [
    new CommandHelp(),
    new CommandExit(),
    new CommandLoginServer(),
    new CommandSet(sharedData.vars),
    new CommandEcho(),
    new CommandPwd(),
    new CommandCd(),
    new CommandLs(),
    new CommandTimer(() => repl.refreshPrompt()),
    new CommandTestArgs(),
  ],
  sharedData,
  {
    tokenizer: CommandArgsTokenizer.unix,
    statusLine: () => `${sharedData.cwd} | ${new Date().toLocaleTimeString()}`,
    history: { filePath: historyFile },
  }
);
await repl.start();
