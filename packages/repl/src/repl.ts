/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { start } from "repl";
import { inspect } from "util";
import type { REPLServer, REPLEval } from "repl";
import type { AsyncCompleter } from "readline";
//
import { BASIC_COLORS } from "./contrib/colors-base.js";
//
import { CommandArgs } from "./tokenizer/index.js";
import type { VarCompletionContext, VarResolver } from "./tokenizer/types.js";
import { CommandArgsTokenizer } from "./tokenizer/types.js";
import type { CommandInterface, CompletionResult, REPLOptions, SharedDataBase } from "./types.js";
import { CommandFlags, SYMBOL_PRINT_HELP } from "./types.js";

const { BOLD, RED, GREEN, RESET } = BASIC_COLORS;

export class REPL {
  static readonly REGEXP_CMD = /^[\w-_\?]+$/;
  static readonly REGEXP_CMD_MATCH = /^\s*([\w-_\?]+)(\s*)/;
  static readonly REGEXP_CMD_LOOSE_MATCH = /^\s*(\S+)(\s*)/;
  static readonly COMMANDS_EXIT = new Set([".exit", "exit", "quit"]);

  static getDefaultSharedData(): SharedDataBase {
    return { repl: undefined, lastResult: undefined, commandMetas: [] };
  }
  static getCmdName(cmd: string, looseMode: boolean) {
    const match = cmd.match(looseMode ? REPL.REGEXP_CMD_LOOSE_MATCH : REPL.REGEXP_CMD_MATCH);
    if (!match) return;
    const rest = cmd.slice(match[0].length).replace(/\r?\n/, "");
    return { name: match[1], rest };
  }

  private static activeREPL?: REPLServer;

  //
  //#region logger
  private static refreshPromptTimer: any;
  private static readonly refreshPrompt = () => {
    delete REPL.refreshPromptTimer;
    const repl = REPL.activeREPL;
    if (!repl) return;
    repl.displayPrompt(true);
  };
  private static readonly delayRefreshPrompt = () => {
    if (REPL.refreshPromptTimer) return;
    REPL.refreshPromptTimer = process.nextTick(REPL.refreshPrompt);
  };

  static readonly log = (...args: unknown[]) => {
    // repl.getCursorPos().cols;
    process.stdout.write(RESET + "\x1b[2K\r");
    console.log(...args);
    process.stdout.write(RESET);
    this.delayRefreshPrompt();
  };
  static readonly error = (...args: unknown[]) => {
    process.stderr.write(RESET + "\x1b[2K\r");
    console.error(...args);
    process.stderr.write(RESET);
    this.delayRefreshPrompt();
  };
  static readonly warn = (...args: unknown[]) => {
    process.stderr.write(RESET + "\x1b[2K\r");
    console.warn(...args);
    process.stderr.write(RESET);
    this.delayRefreshPrompt();
  };
  //#endregion logger
  //

  private commandNames: string[];
  private commandsMap = new Map<string | null, CommandInterface>();
  private tokenizerMap = new Map<string, CommandArgsTokenizer>();
  private commands = new Set([".exit", "help"]);

  private defaultTokenizer: CommandArgsTokenizer;

  private fallbackHandler?: CommandInterface;
  private helpHandler?: CommandInterface;

  private varResolver?: VarResolver;

  private readonly looseCmdName: boolean;

  constructor(
    commands: CommandInterface[],
    private readonly sharedData = REPL.getDefaultSharedData(),
    options?: REPLOptions
  ) {
    const opts: Required<REPLOptions> = {
      tokenizer: CommandArgsTokenizer.simple,
      looseCmdName: false,
      ...(options || {}),
    };
    this.looseCmdName = opts.looseCmdName;
    this.defaultTokenizer = opts.tokenizer;

    sharedData.commandMetas = [];
    commands.forEach((it) => {
      const meta = it.getMeta();
      if (it.connect) it.connect(sharedData);
      sharedData.commandMetas.push(meta);
      meta.match?.forEach((cmd) => {
        this.commands.add(cmd);
        this.commandsMap.set(cmd, it);
        if (meta.tokenizer) this.tokenizerMap.set(cmd, meta.tokenizer);
      });
      switch (meta.flag) {
        case CommandFlags.help:
          this.helpHandler = it;
          break;
        case CommandFlags.fallback:
          this.fallbackHandler = it;
          break;
      }
    });

    this.commandNames = Array.from(this.commands).filter((it) => it);
    if (sharedData.vars) this.enableVariableResolver(sharedData.vars);
  }

  readonly start = () => {
    const repl = start({
      prompt: this.buildReplPrompt(),
      eval: this.execReplCommand,
      completer: this.getReplCompletion,
      ignoreUndefined: true,
      terminal: true,
      useGlobal: false,
      useColors: true,
    });
    this.sharedData.repl = repl;
    REPL.activeREPL = repl;
  };
  readonly active = () => {
    REPL.activeREPL = this.sharedData.repl;
  };
  readonly enableVariableResolver = (resolver: VarResolver) => {
    this.varResolver = resolver;
  };

  buildReplPrompt = () => {
    return GREEN + BOLD + "$ " + RESET;
  };

  getTokenizer(cmdName: string) {
    const tokenizer = this.tokenizerMap.get(cmdName);
    if (typeof tokenizer !== "undefined") return tokenizer;
    return this.defaultTokenizer;
  }

  private readonly execReplCommand: REPLEval = (evalCmd, context, file, cb) => {
    const buildReplPrompt = this.buildReplPrompt.bind(this);
    const { sharedData, commandsMap, fallbackHandler, commandNames, helpHandler, varResolver } = this;
    const parsed = REPL.getCmdName(evalCmd, this.looseCmdName);
    if (!parsed) return cb(null, undefined);

    const { name: cmdName, rest } = parsed;
    const tokenizer = this.getTokenizer(cmdName);

    return handle()
      .then((result) => {
        if (typeof result !== "undefined") {
          sharedData.lastResult = result;
          console.log(inspect(result));
        } else {
          sharedData.lastResult = undefined;
        }
        callback();
      })
      .catch((error) => {
        console.error(error);
        if (typeof error.message === "string") {
          const HEAD = RED + BOLD + "Error: " + RESET;
          console.error(HEAD + RED + error.message + RESET);
        }
        callback();
      });

    function callback() {
      const repl = sharedData.repl;
      if (repl) repl.setPrompt(buildReplPrompt());
      cb(null, undefined);
    }
    async function handle() {
      if (REPL.COMMANDS_EXIT.has(cmdName)) return process.exit(0);

      let isDefaultCmd = false;
      let handler = commandsMap.get(cmdName);
      if (!handler && fallbackHandler) {
        isDefaultCmd = true;
        handler = fallbackHandler;
      }
      if (!handler) {
        console.error(RED + `Unknown command: "${cmdName}"` + RESET);
        console.error(`Commands: ${commandNames.join()}`);
        return;
      }

      let result: unknown;
      const repl = sharedData.repl;
      const cmd = new CommandArgs(rest, tokenizer);
      cmd.enableVarResolver(varResolver);
      if (repl) {
        repl.pause();
        try {
          result = await handler.onCommand(cmdName, cmd);
        } catch (error) {
          repl.resume();
          throw error;
        }
        repl.resume();
      }
      if (result === SYMBOL_PRINT_HELP && helpHandler) {
        const cmd = new CommandArgs(isDefaultCmd ? "" : cmdName, CommandArgsTokenizer.simple);
        await helpHandler.onCommand(helpHandler.getMeta().match![0], cmd);
        return;
      }
      return result;
    }
  };

  private readonly completeVar = (varContext: VarCompletionContext): Promise<CompletionResult> => {
    const vars = this.varResolver!.keys(varContext.varName);
    let result: string[];
    if (varContext.suffix) result = vars.map((it) => `${it}}`);
    else result = vars;
    return Promise.resolve({ result, matched: varContext.varName });
  };

  private readonly getReplCompletion: AsyncCompleter = (prefix: string, callback) => {
    const { commandNames, commandsMap, varResolver } = this;
    const match = prefix.match(REPL.REGEXP_CMD_MATCH);
    const completeCmdName = match ? !match[2] : true;
    if (completeCmdName) {
      const prefix = match ? match[1] : "";
      let names = commandNames;
      if (prefix.length > 0) names = names.filter((it) => it.toLowerCase().startsWith(prefix.toLowerCase()));
      return callback(null, [names.map((it) => `${it} `), prefix]);
    }

    const { name, rest } = REPL.getCmdName(prefix, this.looseCmdName)!;
    const handler = commandsMap.get(name);

    if (!handler) return callback(null, [[], prefix]);

    const tokenizer = this.getTokenizer(name);
    const cmd = new CommandArgs(rest, tokenizer);

    let thenable: ReturnType<Required<CommandInterface>["onCompletion"]> | undefined;
    if (varResolver) {
      cmd.enableVarResolver(varResolver);
      const vars = cmd.varCompletionContext;
      if (vars) thenable = this.completeVar(vars);
    }
    if (!thenable) {
      if (!handler.onCompletion) return callback(null, [[], ""]);
      thenable = handler.onCompletion(name, cmd);
    }

    thenable
      .then((c) => {
        const index = cmd.completionIndex;
        const arg = cmd.args[index];
        let matched = "";
        if (arg) {
          const to = arg.to ?? cmd.raw.length;
          matched = cmd.raw.slice(arg.from, to);
        }

        let result: string[];
        if (Array.isArray(c)) {
          result = c;
        } else if (c) {
          if (typeof c.matched === "string") matched = c.matched;
          result = c.result;
        } else {
          result = [];
        }
        return callback(null, [result, matched]);
      })
      .catch((error) => callback(error));
  };
}
