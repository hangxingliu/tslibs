/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { inspect } from "node:util";
//
import { BASIC_COLORS } from "./contrib/colors-base.js";
import { getCmdName } from "./tokenizer/command-name.js";
import { CommandArgs } from "./tokenizer/index.js";
//
import { CommandArgsTokenizer, type VarResolver } from "./tokenizer/types.js";
import {
  SYMBOL_EXIT,
  SYMBOL_PRINT_HELP,
  type CommandContext,
  type CommandInterface,
  type SharedDataBase,
} from "./types.js";

/**
 * Dependencies of {@link REPLExecutor}. They are provided by the `REPL` constructor,
 * which shares most of them with the `CommandCompleter`.
 */
export type REPLExecutorOptions = {
  /** Maps every command name and alias (from `CommandMeta.match`) to its command */
  commandsMap: ReadonlyMap<string, CommandInterface>;
  /** All keys of {@link commandsMap}; listed in the "Unknown command" error message */
  commandNames: readonly string[];
  /** Receives the last non-help result as `lastResult` */
  sharedData: SharedDataBase;
  /** Returns the tokenizer of a command name (falls back to the REPL's default tokenizer) */
  getTokenizer: (name: string) => CommandArgsTokenizer;
  /** Called on every execution because the variable resolver can be enabled after construction */
  getVarResolver: () => VarResolver | undefined;
  /** Accepts any non-whitespace characters as the command name (e.g. `./run`). See `getCmdName` */
  looseCmdName: boolean;
  /** Handles names not found in {@link commandsMap} (the command flagged with `CommandFlags.fallback`) */
  fallbackHandler?: CommandInterface;
  /** Invoked when a command returns `SYMBOL_PRINT_HELP` (the command flagged with `CommandFlags.help`) */
  helpHandler?: CommandInterface;
  /** Prints results; defaults to `console.log` */
  log?: (...args: unknown[]) => void;
  /** Prints errors; defaults to `console.error` */
  error?: (...args: unknown[]) => void;
};

/** Parses and executes one command; the caller owns terminal and exit policies. */
export class REPLExecutor {
  constructor(private readonly options: REPLExecutorOptions) {}

  /**
   * Executes one command line. Handler errors are printed and never thrown.
   * Non-`undefined` results are printed with `util.inspect` and stored as `sharedData.lastResult`.
   * @returns `exit: true` only when the handler returns `SYMBOL_EXIT`
   */
  async execute(line: string, ctx: CommandContext): Promise<{ exit: boolean }> {
    const {
      commandsMap,
      commandNames,
      sharedData,
      getTokenizer,
      getVarResolver,
      looseCmdName,
      fallbackHandler,
      helpHandler,
    } = this.options;
    const log = this.options.log ?? console.log;
    const printError = this.options.error ?? console.error;
    const parsed = getCmdName(line, looseCmdName);
    // No valid command name (e.g. `./run` in strict mode); blank lines are ignored silently
    if (!parsed) {
      if (line.trim()) printError(BASIC_COLORS.RED + `Unknown command: "${line.trim()}"` + BASIC_COLORS.RESET);
      return { exit: false };
    }
    try {
      // Registered commands take priority; the fallback handler receives any other name
      const handler = commandsMap.get(parsed.name) ?? fallbackHandler;
      let result: unknown;
      if (!handler) {
        // `result` stays `undefined`, so `lastResult` is cleared below
        printError(BASIC_COLORS.RED + `Unknown command: "${parsed.name}"` + BASIC_COLORS.RESET);
        printError(`Commands: ${commandNames.join()}`);
      } else {
        // Arguments are parsed by the tokenizer registered for this command name (or the default one)
        const cmd = new CommandArgs(parsed.rest, getTokenizer(parsed.name));
        cmd.enableVarResolver(getVarResolver());
        result = await handler.onCommand(parsed.name, cmd, ctx);
        // Exit before touching `lastResult`; the caller decides how to close the REPL
        if (result === SYMBOL_EXIT) return { exit: true };
        // Emulates the user typing `help <name>`. Names only handled by the fallback handler pass an
        // empty argument, so the general help is printed. Without a help handler, the symbol itself
        // is printed and stored as a normal result.
        if (result === SYMBOL_PRINT_HELP && helpHandler) {
          const args = new CommandArgs(commandsMap.has(parsed.name) ? parsed.name : "", CommandArgsTokenizer.simple);
          await helpHandler.onCommand(helpHandler.getMeta().match![0], args, ctx);
          result = undefined;
        }
      }
      // Always overwritten, so `lastResult` never refers to an older command's output
      sharedData.lastResult = result;
      if (result !== undefined) log(inspect(result));
    } catch (error) {
      // Prints the full error (with stack) followed by a highlighted one-line summary;
      // `lastResult` keeps its previous value
      printError(error);
      if (error instanceof Error) {
        const { RED, BOLD, RESET } = BASIC_COLORS;
        printError(RED + BOLD + "Error: " + RESET + RED + error.message + RESET);
      }
    }
    return { exit: false };
  }
}
