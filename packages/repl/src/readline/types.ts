/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { Interface as NativeReadlineInterface } from "node:readline";
import type { LineCompleter, NormalizedLineCompleter } from "../complete/types.js";

/**
 * The native `readline.Interface` with writable access to some runtime properties.
 * `@types/node` declares `line` and `cursor` as `readonly` and does not declare `history` at all,
 * but `LineReader` must overwrite them to switch between the command input and `inputLine()` questions.
 */
export type ExtendedReadlineInterface = NativeReadlineInterface & {
  /**
   * The current (not yet accepted) input text.
   * Saved and cleared when an `inputLine()` question starts, restored when it settles,
   * and cleared on Ctrl+C at the command prompt.
   */
  line: string;
  /** Cursor position within {@link line} (0-based index); saved and restored together with `line`. */
  cursor: number;
  /**
   * Undocumented readline property used for Up/Down history navigation, ordered newest-first.
   * Readline mutates it on every accepted line, so `LineReader` keeps replacing it with
   * its own command history (or an empty array while an `inputLine()` question is active).
   * @example ["latest command", "older command"]
   */
  history: string[];
};

/** A pending `inputLine()` question and the command input (`line`/`cursor`) saved before it started. */
export type PendingInputRequest = {
  /** Options of the question; decide the prompt, password mode and completer used in the `input` mode. */
  options: Readonly<InputLineOptions>;
  /** The partial command input (type-ahead) before the question started; restored to `rl.line` afterward. */
  line: string;
  /** The cursor of the saved command input; restored to `rl.cursor` afterward. */
  cursor: number;
  /** Settles the `inputLine()` promise with the accepted answer. */
  resolve: (line: string) => void;
  /** Rejects the `inputLine()` promise, e.g. with {@link REPLInputCancelledError} or a stream error. */
  reject: (error: unknown) => void;
};

/**
 * The current mode of `LineReader`. It decides which completer is used, how Ctrl+C is handled,
 * which history is exposed to readline, and where an accepted line goes:
 *
 * - `prompt`: waiting for a command via `readLine()`. Command completion and history are enabled;
 *   Ctrl+C clears the input, or arms/performs exit when the input is empty.
 * - `busy`: a command is running. Typed lines are shown with an empty prompt and queued for later
 *   `readLine()` calls; completion is disabled; Ctrl+C invokes {@link LineReaderOptions.onInterrupt}.
 * - `input`: an `inputLine()` question is active. The accepted line resolves the question instead of
 *   being queued; the question's own completer is used and history is empty;
 *   Ctrl+C/Ctrl+D cancels the question with {@link REPLInputCancelledError}.
 *
 * Transitions: `prompt` -(line accepted)-> `busy` -(`inputLine()`)-> `input` -(settled)-> `busy`
 * -(`leaveBusy()`/`readLine()`)-> `prompt`.
 */
export type LineReaderStatus = "prompt" | "busy" | "input";

/** Options of `REPL.inputLine()` / `repl.inputLine()` for asking an interactive question. */
export type InputLineOptions = {
  /** Prompt displayed before the question input, e.g. `"Password: "`. Defaults to an empty string. */
  prompt?: string;
  /** Hide typed characters (TTY only). Completion is always disabled for password input. */
  password?: boolean;
  /**
   * Completion for the question input.
   * An array result replaces the whole question input;
   * an object result can narrow the replaced part via `matched`.
   * @example async (line) => ["admin", "guest"].filter((name) => name.startsWith(line))
   */
  completer?: LineCompleter;
};

/** Passed to {@link REPLHistoryOptions.onError} when a history file operation fails. */
export type HistoryFileError = {
  /** `truncate` happens on startup when the file has more entries than the limit. */
  operation: "read" | "truncate" | "append";
  filePath: string;
  error: unknown;
};

export type LoadHistoryFileOptions = {
  /** Maximum number of entries kept in memory and on disk. Positive safe integer, default 1000. */
  limit: number;
  /** Defaults to warning once via `REPL.warn` and continuing without failing the REPL. */
  onError: (failure: HistoryFileError) => void;
};

/** Persistent command history. Only accepted command lines are saved (never question answers). */
export type REPLHistoryOptions = Partial<LoadHistoryFileOptions> & {
  /** The containing directory must already exist. New files are created with mode `0600`. */
  filePath: string;
};

/** A writable stream that may expose TTY properties like `process.stdout`. */
export type TerminalWritableStream = NodeJS.WritableStream &
  Partial<Pick<typeof process.stdout, "columns" | "rows" | "isTTY">>;

export type LineReaderOptions = {
  input: NodeJS.ReadableStream;
  /** Destination of prompts and echoed input, usually `process.stdout`. Wrapped to support password masking. */
  output: TerminalWritableStream;

  /** Defaults to `output.isTTY`. */
  terminal?: boolean;

  /** Initial command history, ordered oldest-first (the order of a history file). */
  history?: readonly string[];
  historySize?: number;

  /** Command completion used in the `prompt` mode only. */
  completer?: NormalizedLineCompleter;

  /** Invoked on Ctrl+C while a command is running (the `busy` mode). */
  onInterrupt?: () => void;

  /** Receives completer and stream errors. Defaults to `console.error`. */
  onError?: (error: unknown) => void;
};

/**
 * Rejection reason of `inputLine()` when the question is cancelled by `Ctrl+C`, `Ctrl+D` or `EOF`.
 */
export class REPLInputCancelledError extends Error {
  constructor() {
    super("Input cancelled");
    this.name = "REPLInputCancelledError";
  }
}
