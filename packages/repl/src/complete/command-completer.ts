/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { getCmdName, REGEXP_CMD_LOOSE_MATCH, REGEXP_CMD_MATCH } from "../tokenizer/command-name.js";
import { CommandArgs } from "../tokenizer/index.js";
import { normalizeCompletion } from "./normalize.js";
//
import type { CommandArgsTokenizer, VarResolver } from "../tokenizer/types.js";
import type { CompletableCommand, CompletionTuple } from "./types.js";

export type CommandCompleterOptions = {
  commandNames: readonly string[];
  commandsMap: ReadonlyMap<string, CompletableCommand>;
  getTokenizer: (name: string) => CommandArgsTokenizer;
  getVarResolver: () => VarResolver | undefined;
  looseCmdName: boolean;
};

/** Command and argument completion, independent of any line editor or terminal rendering. */
export class CommandCompleter {
  constructor(private readonly options: CommandCompleterOptions) {}

  /**
   * Completes a command name, a variable reference, or delegates to the command's `onCompletion`.
   * @returns normalized tuple `[candidates, matched]`
   * @example await completer.complete("he") // => [["help "], "he"]
   */
  async complete(line: string): Promise<CompletionTuple> {
    const { commandNames, commandsMap, getTokenizer, getVarResolver, looseCmdName } = this.options;

    // Phase 1: complete the command name.
    // `match[2]` is the whitespace after the command name; while it is empty, the cursor is still
    // inside the command name (e.g. `"he"`), or the line is empty/invalid (no match at all).
    const match = line.match(looseCmdName ? REGEXP_CMD_LOOSE_MATCH : REGEXP_CMD_MATCH);
    if (!match || !match[2]) {
      const prefix = match?.[1] ?? "";
      // Case-insensitive prefix match; a trailing space is appended so the user can type arguments directly
      const names = commandNames.filter((name) => name.toLowerCase().startsWith(prefix.toLowerCase()));
      return [names.map((name) => `${name} `), prefix];
    }

    // Phase 2: the command name is complete (followed by whitespace), so complete its arguments.
    // Non-null assertion is safe: `getCmdName` uses the same regexp that has just matched above.
    const parsed = getCmdName(line, looseCmdName)!;
    const handler = commandsMap.get(parsed.name);
    // Unknown command: nothing to suggest
    if (!handler) return [[], line];

    // Tokenize the arguments with the command-specific tokenizer to locate the argument under the cursor
    const cmd = new CommandArgs(parsed.rest, getTokenizer(parsed.name));
    // Variable references (`$name` / `${name`) in the current argument take precedence over the command's own completion
    const resolver = getVarResolver();
    if (resolver) {
      cmd.enableVarResolver(resolver);
      const context = cmd.varCompletionContext;
      if (context) {
        // For the `${` form, close the brace for the user. The matched part is only the variable name,
        // so the `$`/`${` prefix typed by the user is kept.
        // e.g. `echo ${us` => [["user}"], "us"]; `echo $us` => [["user"], "us"]
        const names = resolver.keys(context.varName);
        return [context.suffix ? names.map((name) => `${name}}`) : names, context.varName];
      }
    }
    if (!handler.onCompletion) return [[], ""];

    const completion = await handler.onCompletion(parsed.name, cmd);
    // Default matched text is the raw (unescaped, possibly quoted) text of the argument being completed.
    // If the cursor starts a new argument (e.g. the line ends with whitespace), there is no such argument and it is `""`.
    // An unterminated argument (`to` is undefined) extends to the end of the input.
    const arg = cmd.args[cmd.completionIndex];
    const matched = arg ? cmd.raw.slice(arg.from, arg.to ?? cmd.raw.length) : "";
    return normalizeCompletion(completion, matched);
  }
}
