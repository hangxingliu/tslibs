/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { REPLServer } from "repl";
import type { CommandArgs } from "./tokenizer/index.js";
import type { CommandArgsTokenizer, VarResolver } from "./tokenizer/types.js";

export const SYMBOL_PRINT_HELP = Symbol("print-help");

export enum CommandFlags {
  help,
  fallback,
}

export type CommandMeta = {
  flag?: CommandFlags;
  tokenizer?: CommandArgsTokenizer;
  /** fallback command doesn't need to provide this field */
  match?: string[];
  description?: string;
  usage: ReadonlyArray<string | [usage: string, explain: string]>;
  docs?: { [title: string]: string };
};

export type REPLOptions = {
  looseCmdName?: boolean;
  tokenizer?: CommandArgsTokenizer;
};

export type CompletionResult = {
  result: string[];
  matched?: string;
};

export interface CommandInterface<SharedData extends SharedDataBase = SharedDataBase> {
  connect?(sharedData: SharedData): void;
  getMeta(): CommandMeta;
  onCommand(cmdName: string, args: CommandArgs): Promise<any>;
  onCompletion?(cmdName: string, args: CommandArgs): Promise<CompletionResult | string[] | void>;
}

export interface SharedDataBase {
  repl?: REPLServer;
  lastResult?: unknown;
  commandMetas: Readonly<CommandMeta>[];
  vars?: VarResolver;
}
