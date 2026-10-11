/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { createInterface } from "node:readline";
//
import { normalizeCompletion } from "../complete/normalize.js";
import { DEFAULT_HISTORY_LIMIT, shouldRecordHistory, validateHistoryLimit } from "./history-file.js";
import { PausableOutputStream } from "./pausable-output-stream.js";
import { clearRenderedInput, resetRenderedRows } from "./render-utils.js";
//
import type { CompletionTuple } from "../complete/types.js";
import type { ExtendedReadlineInterface, LineReaderStatus, PendingInputRequest } from "./types.js";
import { REPLInputCancelledError, type InputLineOptions, type LineReaderOptions } from "./types.js";

/**
 * One readline interface with FIFO command input and isolated interactive questions.
 *
 * Modes:
 * - `prompt`: waiting for a command; command completion is enabled.
 * - `busy`: a command is running; type-ahead stays visible with an empty prompt, completion is disabled.
 * - `input`: an `inputLine()` question is active, with its own completer and empty history.
 *
 * Every accepted line is captured by the `line` event and queued, so several lines in one input chunk
 * (e.g. paste or pipe) are executed in order and never lost.
 *
 * @example
 * const reader = new LineReader({ input: process.stdin, output: process.stdout });
 * let line: string | null;
 * while ((line = await reader.readLine("$ ")) !== null) {
 *   reader.recordCommand(line);
 *   // `readLine()` has already switched to the busy mode
 *   await runCommand(line);
 *   reader.leaveBusy();
 * }
 */
export class LineReader {
  readonly rl: ExtendedReadlineInterface;
  readonly terminal: boolean;

  private readonly output: PausableOutputStream;
  private readonly historySize: number;

  /** Command history ordered newest-first, the same order as readline's `history` property. */
  private commandHistory: string[];

  /** Accepted command lines that have not been returned by `readLine()` yet. */
  private readonly lineQueue: string[] = [];

  /** The pending `readLine()` call waiting for the next command line. */
  private pending?: { resolve: (line: string | null) => void; reject: (error: unknown) => void };
  private request?: PendingInputRequest;

  private closed = false;

  /** Set by Ctrl+C on empty prompt input; a second consecutive Ctrl+C closes the interface. */
  private armedForExit = false;

  /** Whether the prompt and input are currently drawn on the terminal and must be cleared before printing. */
  private rendered = false;

  private status: LineReaderStatus = "prompt";

  constructor(private readonly options: Readonly<LineReaderOptions>) {
    this.terminal = options.terminal ?? !!options.output.isTTY;
    this.historySize = validateHistoryLimit(options.historySize ?? DEFAULT_HISTORY_LIMIT);
    this.commandHistory = [...(options.history ?? [])].reverse().slice(0, this.historySize);

    this.output = new PausableOutputStream(options.output);

    this.rl = createInterface({
      input: options.input,
      output: this.output,
      terminal: this.terminal,
      historySize: this.historySize,
      crlfDelay: Infinity,
      completer: (line, callback) => {
        // Discard results from an async completion that finished after the mode or question changed
        const mode = this.status;
        const request = this.request;
        this.complete(line).then(
          (result) => callback(null, mode === this.status && request === this.request ? result : [[], line]),
          (error: unknown) => {
            this.printAbove(() => (options.onError ?? console.error)(error));
            callback(null, [[], line]);
          }
        );
      },
    }) as ExtendedReadlineInterface;

    this.rl.history = [...this.commandHistory];

    // Readline mutates its history on every accepted line; replace it so only `recordCommand()` affects history
    this.rl.on("history", () => {
      this.rl.history = this.status === "input" ? [] : [...this.commandHistory];
    });
    this.rl.on("line", this.onLine);
    this.rl.on("SIGINT", this.onSigint);
    this.rl.on("error", this.onStreamError);
    this.rl.once("close", () => {
      this.closed = true;
      this.rendered = false;
      if (this.request) this.finishInput(undefined, new REPLInputCancelledError());
      this.pending?.resolve(null);
      this.pending = undefined;
      this.output.dispose();
      options.input.off("error", this.onStreamError);
      options.input.off("keypress", this.onKeypress);
      options.output.off("error", this.onStreamError);
    });

    options.input.on("error", this.onStreamError);
    options.input.on("keypress", this.onKeypress);
    options.output.on("error", this.onStreamError);

    this.output.on("error", this.onStreamError);
  }

  get isPrompt() {
    return this.status === "prompt";
  }

  private readonly onKeypress = (_text: string, key?: { ctrl?: boolean; name?: string }) => {
    if (key?.ctrl && key.name === "d" && this.status === "input") this.close();
    if (!(key?.ctrl && key.name === "c")) this.armedForExit = false;
  };

  private readonly onStreamError = (error: Error) => {
    if (this.closed) return;
    (this.options.onError ?? console.error)(error);
    if (this.request) this.finishInput(undefined, error);
    if (this.pending) this.pending.reject(error);
    this.pending = undefined;
    this.close();
  };

  private async complete(line: string): Promise<CompletionTuple> {
    if (this.status === "busy") return [[], line];
    if (this.status === "input") {
      const options = this.request!.options;
      if (options.password || !options.completer) return [[], line];
      return normalizeCompletion(await options.completer(line), line);
    }
    return this.options.completer ? this.options.completer(line) : [[], line];
  }

  private readonly onLine = (line: string) => {
    // Enter the busy mode synchronously, before readline processes the remaining lines of the same chunk
    this.armedForExit = false;
    this.rendered = false;
    this.rl.history = this.status === "input" ? [] : [...this.commandHistory];
    if (this.request) return void this.finishInput(line);
    this.lineQueue.push(line);
    this.enterBusy();

    if (this.pending) {
      const pending = this.pending;
      this.pending = undefined;
      pending.resolve(this.lineQueue.shift()!);
    }
  };

  private readonly onSigint = () => {
    if (this.status === "input") {
      if (!this.request?.options.password && this.terminal) this.clearInput();
      return void this.finishInput(undefined, new REPLInputCancelledError());
    }
    if (this.status === "busy") return void this.options.onInterrupt?.();

    if (this.rl.line.length > 0) {
      this.armedForExit = false;
      this.clearInput();
      this.rl.line = "";
      this.rl.cursor = 0;
      this.draw();
    } else if (this.armedForExit) {
      this.close();
    } else {
      this.armedForExit = true;
      this.printAbove(() => this.options.output.write("(To exit, press Ctrl+C again or Ctrl+D)\n"));
    }
  };

  private clearInput() {
    if (this.terminal && this.rendered) clearRenderedInput(this.rl, this.options.output);
    this.rendered = false;
  }

  private draw() {
    if (this.closed) return;
    this.rl.prompt(true);
    this.rendered = this.terminal;
  }

  /**
   * Reads the next command line, returning a queued line immediately if available.
   * On return the reader is already in the `busy` mode; call {@link leaveBusy} after executing the command.
   * @param prompt may contain `\n` (e.g. a status line above the prompt); readline handles multiline prompts
   * @returns `null` when the interface is closed (Ctrl+D, double Ctrl+C or EOF) and no queued line remains
   */
  readLine(prompt: string): Promise<string | null> {
    if (this.pending) return Promise.reject(new Error("A command read is already pending"));
    if (this.request) return Promise.reject(new Error("An inputLine() call is already pending"));

    this.status = "prompt";
    this.output.paused = false;
    this.clearInput();
    this.rl.setPrompt(prompt);

    const queued = this.lineQueue.shift();
    if (queued !== undefined) {
      // Echo the queued line after the last prompt row, as if it had been typed at this prompt
      if (this.terminal) this.options.output.write(`${prompt.slice(prompt.lastIndexOf("\n") + 1)}${queued}\n`);
      this.enterBusy();
      return Promise.resolve(queued);
    }
    if (this.closed) return Promise.resolve(null);

    this.draw();
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject };
    });
  }

  /** Adds an accepted command line to the in-memory history, skipping ignored lines and consecutive duplicates. */
  recordCommand(line: string) {
    if (shouldRecordHistory(line) && line !== this.commandHistory[0]) {
      this.commandHistory.unshift(line);
      this.commandHistory.length = Math.min(this.commandHistory.length, this.historySize);
    }
    this.rl.history = [...this.commandHistory];
  }

  /** Switches to the `busy` status: an empty prompt keeps type-ahead visible while completion is disabled. */
  enterBusy() {
    if (this.status === "busy") return;
    this.clearInput();
    this.status = "busy";
    this.output.paused = false;
    this.rl.setPrompt("");
    resetRenderedRows(this.rl);
    this.draw();
  }

  /** Clears busy type-ahead rendering; the partial input and cursor are kept for the next `readLine()`. */
  leaveBusy() {
    this.clearInput();
    this.output.paused = false;
    resetRenderedRows(this.rl);
    this.status = "prompt";
  }

  /** Redraws a new prompt while waiting for a command, preserving typed input and cursor. No-op in other modes. */
  refreshPrompt(prompt: string) {
    if (!this.isPrompt || this.closed || !this.pending) return;
    this.clearInput();
    this.rl.setPrompt(prompt);
    this.draw();
  }

  /**
   * Runs `write` with the live input cleared, then redraws the prompt and input below the printed text.
   * For password questions, the input is never redrawn; only the prompt is written again.
   * @example reader.printAbove(() => console.log("timer fired"));
   */
  printAbove(write: () => void) {
    const password = this.status === "input" && this.request?.options.password;
    if (!password) this.clearInput();
    write();
    if (password) {
      if (!this.closed) this.options.output.write(this.request!.options.prompt ?? "");
    } else if (this.terminal) this.draw();
  }

  /**
   * Asks an interactive question while a command is running.
   * The partial command input and cursor are saved and restored after the question settles,
   * and queued command lines are left untouched.
   * @throws {REPLInputCancelledError} (rejection) on Ctrl+C, Ctrl+D or EOF
   */
  inputLine(options: Readonly<InputLineOptions> = {}): Promise<string> {
    if (this.status !== "busy")
      return Promise.reject(new Error("inputLine() can only be called while a command is running"));
    if (this.closed) return Promise.reject(new REPLInputCancelledError());

    this.clearInput();
    return new Promise((resolve, reject) => {
      this.request = { options, line: this.rl.line, cursor: this.rl.cursor, resolve, reject };
      this.rl.line = "";
      this.rl.cursor = 0;
      this.rl.history = [];
      this.status = "input";
      resetRenderedRows(this.rl);
      this.rl.setPrompt(options.prompt ?? "");
      if (options.password && this.terminal) {
        this.options.output.write(options.prompt ?? "");
        this.output.paused = true;
      } else {
        this.output.paused = false;
        this.draw();
      }
    });
  }

  /** Settles the question synchronously so the next input event in the same chunk goes to the command queue. */
  private finishInput(line?: string, error?: unknown) {
    const request = this.request;
    if (!request) return;

    this.request = undefined;
    if (request.options.password && this.terminal) this.options.output.write("\n");

    this.rl.line = request.line;
    this.rl.cursor = request.cursor;
    this.rl.history = [...this.commandHistory];
    this.status = "busy";
    this.output.paused = false;
    this.rendered = false;
    this.rl.setPrompt("");
    resetRenderedRows(this.rl);
    this.draw();

    if (error !== undefined) request.reject(error);
    else request.resolve(line!);
  }

  close() {
    if (!this.closed) this.rl.close();
  }
}
