/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { CommandArgs } from "./tokenizer/index.js";
import type { CommandArgsTokenizer, VarResolver } from "./tokenizer/types.js";
import type { REPLHistoryOptions, TerminalWritableStream } from "./readline/types.js";
import type { CompletableCommand } from "./complete/types.js";

/** Return it from `onCommand` to let the REPL to call default help command to print help info */
export const SYMBOL_PRINT_HELP = Symbol("print-help");

/** Return it from `onCommand` to close the REPL, e.g. `CommandExit`. */
export const SYMBOL_EXIT = Symbol("exit");

/** The third argument of `onCommand`. */
export interface CommandContext {
  /** Aborted on the first Ctrl+C while the command runs. Long-running handlers should observe it. */
  signal: AbortSignal;
}

/** Special roles of a command, declared by {@link CommandMeta.flag}. If several commands declare the same flag, the last one wins. */
export enum CommandFlags {
  /**
   * The help command (e.g. the built-in `CommandHelp`). When another command returns {@link SYMBOL_PRINT_HELP},
   * the REPL calls this command's `onCommand` with the first name in its `match` and the original command name
   * as the only argument (or no argument if the original command is a fallback).
   */
  help,

  /**
   * Handles every command line whose name doesn't match any registered command, instead of "Unknown command".
   */
  fallback,
}

/**
 * Static metadata of a command. It is read once by the REPL constructor (via `getMeta()`) and also
 * stored in {@link SharedDataBase.commandMetas}, so the help command can print usages and docs.
 * @example
 * {
 *   match: ["ls", "dir"],
 *   description: "List files",
 *   usage: ["ls [-a] [path]", ["ls -l <path>", "list files in long format"]],
 *   docs: { examples: "ls -a /tmp" },
 * }
 */
export type CommandMeta = {
  /** Marks this command as the help command or the fallback command. */
  flag?: CommandFlags;

  /** Tokenizer used to split the arguments of this command. Defaults to {@link REPLOptions.tokenizer}. */
  tokenizer?: CommandArgsTokenizer;

  /**
   * Command names (including aliases) routed to this command; they are also used for command name completion.
   * The matched name is passed to `onCommand`/`onCompletion` as `cmdName`.
   * Fallback commands don't need to provide this field.
   */
  match?: string[];

  /** One-line summary shown by the help command next to the first usage line (only if no usage has an explanation). */
  description?: string;

  /**
   * Usage lines printed by the help command. Each item is either a usage string,
   * or a tuple of the usage string and its explanation, which is aligned in a right column.
   */
  usage: ReadonlyArray<string | [usage: string, explain: string]>;

  /**
   * Extra help sections printed by `help <command>`. Keys are section titles (the first letter is capitalized)
   * and values are their contents, which can contain multiple lines.
   */
  docs?: { [title: string]: string };
};

export type REPLOptions = {
  /**
   * Accept any non-whitespace characters as a command name (e.g. `./run`), instead of only `[\w-?]+`.
   * Default `false`.
   */
  looseCmdName?: boolean;

  /** Default tokenizer for commands without {@link CommandMeta.tokenizer}. Defaults to `CommandArgsTokenizer.simple`. */
  tokenizer?: CommandArgsTokenizer;

  /**
   * Evaluated for each new prompt (and by `refreshPrompt()`) and displayed above the prompt on TTYs.
   * Empty values hide the status line; CR/LF characters are replaced with spaces.
   * @example () => `${process.cwd()} | ${new Date().toLocaleTimeString()}`
   */
  statusLine?: () => string | null | undefined;

  /** No history file is read or written unless this option is configured. */
  history?: REPLHistoryOptions;

  /** Called once when the REPL closes. Defaults to `process.exit(0)`. */
  onExit?: () => void;

  /** Caller-owned input stream. Defaults to `process.stdin`. */
  input?: NodeJS.ReadableStream;

  /** Caller-owned output stream. Defaults to `process.stdout`; TTY mode follows `output.isTTY`. */
  output?: TerminalWritableStream;
};

/**
 * A REPL command. Instances are passed to the `REPL` constructor, which calls `getMeta()` and `connect()`
 * once for each of them, then routes command lines by {@link CommandMeta.match}.
 * @example
 * class CommandEcho implements CommandInterface<MySharedData> {
 *   getMeta = (): CommandMeta => ({ match: ["echo"], usage: ["echo <...text>"] });
 *   async onCommand(cmdName: string, args: CommandArgs) {
 *     if (args.length === 0) return SYMBOL_PRINT_HELP;
 *     console.log(args.getRestStr(0).join(" "));
 *   }
 * }
 */
export interface CommandInterface<SharedData extends SharedDataBase = SharedDataBase> extends CompletableCommand {
  /**
   * Receives the shared data object of the REPL (the second argument of the `REPL` constructor) during construction.
   * Store it to share state with other commands, e.g. a current working directory.
   * Note: `commandMetas` is still being populated when this method is called.
   */
  connect?(sharedData: SharedData): void;

  /** Returns static metadata. It is called once by the REPL constructor (and by the REPL for the help command). */
  getMeta(): CommandMeta;

  /**
   * Executes the command. Thrown errors are printed and don't close the REPL.
   * @param cmdName the matched command name (an alias in {@link CommandMeta.match}, or any name for a fallback command)
   * @param args parsed arguments, after the command name; variables are resolved if a resolver is enabled
   * @returns any non-`undefined` value is printed with `util.inspect` and stored as {@link SharedDataBase.lastResult}.
   * Return {@link SYMBOL_PRINT_HELP} to print the help of this command, or {@link SYMBOL_EXIT} to close the REPL.
   */
  onCommand(cmdName: string, args: CommandArgs, ctx?: CommandContext): Promise<any>;
}

/**
 * State shared by the REPL and all commands. Extend it with your own fields (e.g. `cwd`)
 * and pass an instance as the second argument of the `REPL` constructor;
 * commands receive it from {@link CommandInterface.connect}.
 * Defaults to `REPL.getDefaultSharedData()`.
 */
export interface SharedDataBase {
  /** The value returned by the last executed command (`undefined` for no value or after help is printed). */
  lastResult?: unknown;

  /**
   * Metadata of all registered commands, in registration order. It is reset and filled by the REPL constructor,
   * and is mainly read by the help command for listing usages and completing command names.
   */
  commandMetas: Readonly<CommandMeta>[];
  /**
   * Optional variable store. If it is provided when the REPL is constructed, variable references
   * (e.g. `$name`, `${name}`) in arguments are resolved and completed by it.
   * `DefaultVarResolver` is a ready-to-use implementation and `CommandSet` can modify it.
   */
  vars?: VarResolver;
}
