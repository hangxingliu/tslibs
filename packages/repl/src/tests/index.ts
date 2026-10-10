import { REPL, CommandHelp, CommandSet, CommandArgsTokenizer } from "../index.js";
import { CommandCd } from "./cmd-cd.js";
import { CommandLs } from "./cmd-ls.js";
import { CommandPwd } from "./cmd-pwd.js";
import { SharedData } from "./shared-data.js";
import { CommandTimer } from "./cmd-timer.js";
import { CommandEcho } from "./cmd-echo.js";
import { CommandTestArgs } from "./cmd-args.js";

const sharedData = new SharedData();
const repl = new REPL(
  [
    new CommandHelp(),
    new CommandSet(sharedData.vars),
    new CommandEcho(),
    new CommandPwd(),
    new CommandCd(),
    new CommandLs(),
    new CommandTimer(),
    new CommandTestArgs(),
  ],
  sharedData,
  {
    tokenizer: CommandArgsTokenizer.unix,
  }
);
repl.start();
