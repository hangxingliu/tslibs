/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { CompletionResult } from "../complete/types.js";
import type { ParseArgsOptionDescriptor as _ParseArgsOptionDescriptor } from "node:util";

/**
 * Completer for the value of an option that takes a value (non-boolean option).
 * It is invoked by {@link DefaultArgsParser.complete} when the cursor is on the token right after the option flag.
 * Returning `undefined` means no completion candidates.
 *
 * Note: unlike {@link RestValueCompleter}, this completer is expected to be synchronous.
 *
 * @param val the (partial) value being typed by the user
 * @param arg the option flag exactly as typed by the user, e.g. `"--host"` or `"-h"`
 * @example
 * (val) => completeKeyword(val, ["192.168.1.1", "127.0.0.1"])
 */
export type OptionValueCompleter = (val: string, arg: string) => string[] | CompletionResult | undefined;

/**
 * Completer for rest (positional) arguments. It may be asynchronous,
 * but a returned Promise is only awaited when completion runs in async mode
 * (otherwise an empty result is used).
 *
 * @param val the (partial) rest argument being typed by the user
 * @param leadingRestArgs rest arguments that appear before the current one (option flags and their values are excluded)
 * @example
 * // command line: `cmd --force Mike Jo|` (cursor at `|`) => val = "Jo", leadingRestArgs = ["Mike"]
 * (val, leading) => completeKeyword(val, leading.length > 0 ? ["John"] : ["Mike"])
 */
export type RestValueCompleter = (
  val: string,
  leadingRestArgs: string[]
) => string[] | CompletionResult | undefined | Promise<string[] | CompletionResult | undefined>;

/**
 * The option descriptor from `node:util` `parseArgs`, extended with REPL-specific fields
 * used for help text generation and auto completion.
 */
export type ParseArgsOptionDescriptor = _ParseArgsOptionDescriptor & {
  /**
   * Extra option flags matched literally (they are NOT prefixed automatically),
   * so the leading dashes should usually be included.
   * @example ["--another-name", "-N"]
   */
  aliases?: string[];

  /** Description of this option displayed in the help text */
  help?: string;

  /**
   * Name of the option value displayed in the help text, e.g. `--output <file>`.
   * Defaults to `"list"` for `multiple` options and `"str"` otherwise.
   */
  param?: string;

  /** Completer for the option value. It is ignored for boolean options because they don't take a value */
  completer?: OptionValueCompleter;
};

/**
 * Configuration of {@link DefaultArgsParser}.
 *
 * @example
 * new DefaultArgsParser({
 *   options: {
 *     force: { short: "f", type: "boolean", help: "Skip confirmation" },
 *     output: { short: "o", type: "string", param: "file" },
 *   },
 *   rest: [1, 2],
 *   restCompleter: (val) => completeKeyword(val, ["Mike", "John"]),
 * });
 */
export type ArgsParserConfig = {
  /** Option descriptors keyed by the long option name (without the `--` prefix) */
  options: {
    [longOption: string]: ParseArgsOptionDescriptor;
  };

  /**
   * The allowed count range of rest (positional) arguments, both inclusive.
   * `max` defaults to `Infinity` when omitted. No rest arguments are allowed if this field is omitted.
   * @example [1] // at least one rest argument
   * @example [0, 2] // up to two rest arguments
   */
  rest?: [min: number, max?: number];
  restCompleter?: RestValueCompleter;
};
