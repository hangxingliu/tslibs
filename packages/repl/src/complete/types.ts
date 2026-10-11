/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { CommandArgs } from "../tokenizer/index.js";

/**
 * Completion result returned by `CommandInterface.onCompletion` or an `inputLine()` completer.
 * Returning a plain `string[]` is the same as returning `{ result }` without `matched`.
 *
 * The REPL replaces the `matched` text right before the cursor with the selected candidate
 * (or with their common prefix when there are multiple candidates).
 * @example
 * // input: "cd src/co|" (`|` is the cursor)
 * { result: ["components/", "config/"], matched: "co" }
 * // => the input can be completed to "cd src/con"/"cd src/components/"
 */
export type CompletionResult = {
  /**
   * Completion candidates. Each one replaces `matched` entirely, so it should contain the matched text itself.
   * Append a trailing space (e.g. `"help "`) to indicate the completed token is finished.
   */
  result: string[];
  /**
   * The text before the cursor that will be replaced by a candidate.
   * Defaults to the raw text (including quotes) of the argument being completed for commands,
   * or to the whole input line for `inputLine()` completers.
   */
  matched?: string;
};

/** Any value a user-provided completer may return. `void` means no candidates. */
export type CompletionValue = CompletionResult | string[] | void;

/**
 * Normalized completion `[candidates, matched]`, independent of any line editor.
 * It is the same shape as the result of a `node:readline` completer.
 */
export type CompletionTuple = [candidates: string[], matched: string];

/** Completes a whole input line, e.g. the `completer` of `inputLine()`. */
export type LineCompleter = (line: string) => Promise<CompletionValue>;

/** Completes a whole command line to a normalized tuple, e.g. `CommandCompleter.complete`. */
export type NormalizedLineCompleter = (line: string) => Promise<CompletionTuple>;

/** The part of a command used by the command completer; `CommandInterface` satisfies it. */
export interface CompletableCommand {
  /**
   * Provides completion candidates for the arguments of this command when the user presses Tab.
   * It is not called while completing the command name or a variable reference (e.g. `$na`).
   * Use `args.completionContext` to get the index and text of the argument under completion.
   * @returns candidates, or `void` for no candidates. See `CompletionResult`.
   * @example
   * async onCompletion(cmdName: string, args: CommandArgs) {
   *   const { index, str } = args.completionContext;
   *   if (index === 0) return completePath(str, this.sharedData!.cwd);
   * }
   */
  onCompletion?(cmdName: string, args: CommandArgs): Promise<CompletionValue>;
}
