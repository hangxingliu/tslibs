/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { BASIC_COLORS } from "./contrib/colors-base.js";
import type { CommandCompleterOptions } from "./complete/command-completer.js";
import { CommandCompleter } from "./complete/command-completer.js";
import {
  DEFAULT_HISTORY_LIMIT,
  HistoryFileWriter,
  loadHistoryFile,
  validateHistoryLimit,
} from "./readline/history-file.js";
import { LineReader } from "./readline/index.js";
import type { InputLineOptions } from "./readline/types.js";
import { REPLExecutor } from "./repl-executor.js";
import type { CompletionTuple } from "./complete/types.js";
//
import { CommandArgsTokenizer, type VarResolver } from "./tokenizer/types.js";
import {
  CommandFlags,
  type CommandContext,
  type CommandInterface,
  type REPLOptions,
  type SharedDataBase,
} from "./types.js";
import { getDefaultHistoryFileErrorHandler } from "./defaults/error-handlers.js";

const { BOLD, GREEN, RESET } = BASIC_COLORS;

/** A command-oriented REPL backed by node:readline, compatible with Node and Bun. */
export class REPL {
  /** The instance used by static loggers and `REPL.inputLine()`; see {@link active}. */
  private static activeREPL?: REPL;
  /** A temporary reader created by `REPL.inputLine()` when no REPL instance is active. */
  private static standaloneReader?: LineReader;

  static getDefaultSharedData(): SharedDataBase {
    return { lastResult: undefined, commandMetas: [] };
  }

  /** Prints above the live input without disturbing it. Prefer these loggers over `console.*` for async output. */
  static readonly log = (...args: unknown[]) => REPL.print(() => console.log(...args));
  static readonly error = (...args: unknown[]) => REPL.print(() => console.error(...args));
  static readonly warn = (...args: unknown[]) => REPL.print(() => console.warn(...args));

  private static print(write: () => void) {
    const reader = REPL.activeREPL?.reader ?? REPL.standaloneReader;
    if (reader) reader.printAbove(write);
    else write();
  }

  /**
   * Asks an interactive question. Delegates to the active instance (only allowed while a command is running);
   * without an active instance it creates a temporary interface on stdin/stdout and closes it after one answer.
   * @throws {REPLInputCancelledError} (rejection) on Ctrl+C, Ctrl+D or EOF
   * @example
   * const password = await REPL.inputLine({ prompt: "Password: ", password: true });
   */
  static async inputLine(options?: InputLineOptions): Promise<string> {
    if (REPL.activeREPL) return REPL.activeREPL.inputLine(options);
    if (REPL.standaloneReader) throw new Error("An inputLine() call is already pending");
    const reader = new LineReader({ input: process.stdin, output: process.stdout });
    REPL.standaloneReader = reader;
    try {
      reader.enterBusy();
      return await reader.inputLine(options);
    } finally {
      reader.close();
      REPL.standaloneReader = undefined;
    }
  }

  private readonly commandsMap = new Map<string, CommandInterface>();
  private readonly tokenizerMap = new Map<string, CommandArgsTokenizer>();
  private readonly defaultTokenizer: CommandArgsTokenizer;
  private readonly completer: CommandCompleter;
  private readonly executor: REPLExecutor;
  private varResolver?: VarResolver;
  private reader?: LineReader;
  /** Whether {@link reader} has been closed (EOF, Ctrl+D, double Ctrl+C), possibly while a command is still running */
  private readerClosed = false;
  private started = false;

  /**
   * Whether a command handler is executing; instance `inputLine()` is only allowed in this state.
   */
  private runningCommand = false;

  constructor(
    commands: CommandInterface[],
    sharedData = REPL.getDefaultSharedData(),
    private readonly options: REPLOptions = {}
  ) {
    this.defaultTokenizer = options.tokenizer ?? CommandArgsTokenizer.simple;
    sharedData.commandMetas = [];

    let fallbackHandler: CommandInterface | undefined;
    let helpHandler: CommandInterface | undefined;
    for (const command of commands) {
      const meta = command.getMeta();
      command.connect?.(sharedData);
      sharedData.commandMetas.push(meta);
      for (const name of meta.match ?? []) {
        this.commandsMap.set(name, command);
        if (meta.tokenizer !== undefined) this.tokenizerMap.set(name, meta.tokenizer);
      }
      if (meta.flag === CommandFlags.help) helpHandler = command;
      if (meta.flag === CommandFlags.fallback) fallbackHandler = command;
    }

    const commonArgs = {
      commandNames: [...this.commandsMap.keys()],
      commandsMap: this.commandsMap,
      getTokenizer: this.getTokenizer.bind(this),
      getVarResolver: () => this.varResolver,
      looseCmdName: options.looseCmdName ?? false,
    } satisfies CommandCompleterOptions;

    this.completer = new CommandCompleter(commonArgs);
    this.executor = new REPLExecutor({
      ...commonArgs,
      sharedData,
      fallbackHandler,
      helpHandler,
      //
      log: REPL.log,
      error: REPL.error,
    });
    if (sharedData.vars) this.enableVariableResolver(sharedData.vars);
  }

  /**
   * Starts the command loop. It can only be called once per instance.
   * Resolves when the REPL closes (EOF, Ctrl+D, double Ctrl+C or a command returning `SYMBOL_EXIT`),
   * after calling `onExit` once; `onExit` defaults to `process.exit(0)`.
   */
  readonly start = async (): Promise<void> => {
    if (this.started) throw new Error("REPL has already been started");
    this.started = true;

    // History is optional: without `options.history` it lives only in memory for this session.
    // Lines loaded from the file are truncated to `historySize`; the writer receives the newest
    // loaded entry so the first appended line is not a duplicate of the file's last line.
    const onHistoryError = this.options.history?.onError ?? getDefaultHistoryFileErrorHandler(REPL.warn);
    const historySize = validateHistoryLimit(this.options.history?.limit ?? DEFAULT_HISTORY_LIMIT);
    const historyItems = this.options.history
      ? loadHistoryFile(this.options.history.filePath, { limit: historySize, onError: onHistoryError })
      : [];
    const historyWriter = this.options.history
      ? new HistoryFileWriter(this.options.history.filePath, onHistoryError, historyItems.at(-1))
      : undefined;

    /** Aborts the running command; `undefined` between commands */
    let controller: AbortController | undefined;
    /** Ctrl+C received after a line was accepted but before its controller was created */
    let pendingInterrupts = 0;
    let exitCalled = false;
    /** Calls `onExit` at most once, whichever path (EOF, `SYMBOL_EXIT`, double Ctrl+C) gets here first */
    const exit = () => {
      if (exitCalled) return;
      exitCalled = true;
      (this.options.onExit ?? (() => process.exit(0)))();
    };

    /** Stops waiting for the running command handler (the handler itself cannot be cancelled forcibly) */
    let forceExit: (() => void) | undefined;

    // The first Ctrl+C during a command aborts its signal, the second one exits immediately
    const interrupt = () => {
      // Busy mode starts inside `readLine()` before the controller exists; defer the interrupt
      // so it is replayed by the loop right after the controller is created
      if (!controller) {
        pendingInterrupts++;
        return;
      }
      if (!controller.signal.aborted) {
        controller.abort();
        reader.printAbove(() => (this.options.output ?? process.stdout).write("^C\n"));
      } else {
        // The handler ignored the abort signal: stop waiting for it and exit
        reader.close();
        forceExit?.();
        exit();
      }
    };

    const reader = new LineReader({
      input: this.options.input ?? process.stdin,
      output: this.options.output ?? process.stdout,
      terminal: this.options.terminal,
      history: historyItems,
      historySize,
      completer: (line) => this.completer.complete(line),
      onInterrupt: interrupt,
    });
    this.reader = reader;
    this.readerClosed = false;
    reader.rl.once("close", () => {
      this.readerClosed = true;
    });
    // Route static loggers and `REPL.inputLine()` to this instance
    this.active();

    try {
      while (!exitCalled) {
        // Resolves with a queued type-ahead line immediately if one exists; `null` means EOF/Ctrl+D/closed
        const line = await reader.readLine(this.buildFullPrompt());
        if (line === null) break;

        // Record into in-memory history (for arrow keys) and persist to the history file
        reader.recordCommand(line);
        historyWriter?.append(line);
        // `readLine()` already switched to busy mode; this call is an idempotent safeguard
        reader.enterBusy();

        controller = new AbortController();
        // Replay Ctrl+C presses received before the controller existed:
        // one aborts the signal, a second one exits (see `interrupt`)
        while (pendingInterrupts > 0) {
          pendingInterrupts--;
          interrupt();
        }
        if (exitCalled) break;
        this.runningCommand = true;
        // Resolves with `null` when `forceExit` is called, letting the race below skip a stuck handler
        const forced = new Promise<null>((resolve) => {
          forceExit = () => resolve(null);
        });

        try {
          const result = await Promise.race([this.executor.execute(line, { signal: controller.signal }), forced]);
          // `null`: forced exit by a second Ctrl+C; `exit`: the handler returned `SYMBOL_EXIT`
          if (result === null || result.exit) break;
        } finally {
          // Reset per-command state and return the reader to prompt mode (keeps any type-ahead input)
          this.runningCommand = false;
          controller = undefined;
          forceExit = undefined;
          reader.leaveBusy();
        }
      }
    } finally {
      // Runs on every termination path, including errors thrown by `readLine()` (e.g. input stream errors)
      reader.close();
      this.reader = undefined;
      if (REPL.activeREPL === this) REPL.activeREPL = undefined;
      exit();
    }
  };

  /**
   * Simulates a Ctrl+C keypress, e.g. to forward a process `SIGINT` to the REPL.
   * It follows the same rules as Ctrl+C: at the prompt it clears the input (or arms/closes on empty input),
   * while a command runs it aborts `ctx.signal` (a second call invokes `onExit`), and it cancels a pending question.
   * It does nothing before `start()` or after the interface is closed.
   * @example process.on("SIGINT", () => repl.interrupt());
   */
  interrupt() {
    if (!this.reader || this.readerClosed) return;
    this.reader.rl.emit("SIGINT");
  }

  /**
   * Executes one command line without the interactive loop (e.g. for scripts or tests); `start()` is not required.
   * Handler errors are printed and never thrown. Instance `inputLine()` is not available to the handler.
   * @param ctx defaults to a context with a new, never-aborted signal
   * @returns `exit: true` only when the handler returns `SYMBOL_EXIT`
   * @example const { exit } = await repl.execute("echo hello");
   */
  execute(line: string, ctx?: Partial<CommandContext>): Promise<{ exit: boolean }> {
    return this.executor.execute(line, { ...ctx, signal: ctx?.signal ?? new AbortController().signal });
  }

  /**
   * Completes a command line the same way as pressing Tab at the prompt.
   * @returns normalized `[candidates, matched]` tuple
   * @example await repl.complete("he") // => [["help "], "he"]
   */
  complete(line: string): Promise<CompletionTuple> {
    return this.completer.complete(line);
  }

  /** Selects this instance as the target of static loggers and `REPL.inputLine()`. `start()` calls it implicitly. */
  readonly active = () => {
    REPL.activeREPL = this;
  };
  readonly enableVariableResolver = (resolver: VarResolver) => {
    this.varResolver = resolver;
  };

  /** Override to customize the command prompt (without the status line). */
  buildReplPrompt = () => GREEN + BOLD + "$ " + RESET;

  /**
   * Composes the status line (TTY only) and the command prompt as one multiline readline prompt.
   * @example "/home/user | 10:00:00\x1b[0m\n\x1b[32m\x1b[1m$ \x1b[0m"
   */
  buildFullPrompt() {
    const prompt = this.buildReplPrompt();
    if (!this.reader?.terminal) return prompt;
    const status = this.options.statusLine?.();
    return status ? `${status.replace(/[\r\n]/g, " ")}${RESET}\n${prompt}` : prompt;
  }

  /** Re-evaluates the status line while waiting for a command, preserving typed input. No-op otherwise. */
  refreshPrompt() {
    if (this.reader?.isPrompt) this.reader.refreshPrompt(this.buildFullPrompt());
  }

  /**
   * Asks an interactive question; only allowed while a command of this instance is running.
   * @see REPL.inputLine
   */
  inputLine(options?: InputLineOptions): Promise<string> {
    if (!this.runningCommand || !this.reader)
      return Promise.reject(new Error("inputLine() can only be called while a command is running"));
    return this.reader.inputLine(options);
  }

  getTokenizer(cmdName: string) {
    return this.tokenizerMap.get(cmdName) ?? this.defaultTokenizer;
  }
}
