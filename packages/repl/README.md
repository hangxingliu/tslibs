# @hangxingliu/repl

A command-oriented REPL built on `node:readline`, compatible with Node.js 22+ and Bun 1.4+.
Commands are tokenized and dispatched to registered handlers, never evaluated as JavaScript.

```ts
import { CommandExit, CommandHelp, REPL } from "@hangxingliu/repl";

const repl = new REPL(
  [
    new CommandHelp(),
    new CommandExit(),
    {
      getMeta: () => ({ match: ["hello"], usage: ["hello"] }),
      async onCommand(_name, _args, ctx) {
        REPL.log("Hello!");
        // Long-running operations should observe ctx?.signal.
      },
    },
  ],
  undefined,
  {
    statusLine: () => `${process.cwd()} | ${new Date().toLocaleTimeString()}`,
    history: { filePath: "/path/to/existing-directory/history", limit: 1000 },
    onExit: () => {}, // Omit to keep the default process.exit(0).
  }
);

await repl.start();
```

## Commands and shared data

A command implements `CommandInterface`:

- `getMeta()` returns `CommandMeta`: `match` (names and aliases), `usage`, `description` and `docs` for
  the help command, an optional per-command `tokenizer`, and `flag` (`CommandFlags.help` or `CommandFlags.fallback`).
- `connect(sharedData)` (optional) receives the second constructor argument, a `SharedDataBase` object
  shared by all commands. Extend it with your own state, such as a current directory.
- `onCommand(cmdName, args, ctx?)` executes it. Non-`undefined` results are printed and stored in
  `sharedData.lastResult`; return `SYMBOL_PRINT_HELP` to print its help or `SYMBOL_EXIT` to close the REPL.
- `onCompletion(cmdName, args)` (optional) completes arguments. It returns `string[]` or
  `{ result, matched? }`, where `matched` is the text before the cursor replaced by a candidate
  (defaults to the argument under completion).

`SharedDataBase.commandMetas` is filled by the constructor and read by `CommandHelp`. If
`SharedDataBase.vars` is a `VarResolver` (such as `DefaultVarResolver`), `$name`/`${name}` references are
resolved and completed.

## Input and output

`start(): Promise<void>` resolves when the interface closes (including EOF), or a registered command
returns `SYMBOL_EXIT`. Register `CommandExit` explicitly to enable `exit`; other commands can use that
symbol or implement their own exit behavior. `onExit` runs once; by default it calls `process.exit(0)`.
An instance can only be started once.

Command input remains visible while a command runs. Complete lines are queued and executed in FIFO
order; incomplete input and its cursor position survive command completion. Completion is disabled
while executing a command. Piped input is drained before closing, including a final unterminated line.
Use `REPL.log`, `REPL.warn` and `REPL.error` to print above live input without moving its cursor.
Direct `console.*` calls and stream writes bypass input redraw; prefer the REPL loggers for asynchronous
output. Output without a trailing newline can leave the next prompt on the same line.

At the command prompt, Ctrl+C clears nonempty input. Two consecutive Ctrl+C presses on empty input
close the interface; Ctrl+D also closes it. While a command runs, the first Ctrl+C aborts the optional
third handler argument's `ctx.signal` and prints `^C`, but still waits for the handler to finish.
A second Ctrl+C invokes `onExit` immediately. Handlers must cooperate with the signal to cancel their work;
a custom `onExit` replaces process termination and is responsible for any remaining background work.

### Interactive questions

```ts
const username = await REPL.inputLine({
  prompt: "Username: ",
  completer: async (line) => ["admin", "guest"].filter((name) => name.startsWith(line)),
});
const password = await REPL.inputLine({ prompt: "Password: ", password: true });
```

Both `repl.inputLine(options)` and `REPL.inputLine(options)` return `Promise<string>`.
Options are `prompt?: string`, `password?: boolean` and
`completer?: (line: string) => Promise<CompletionResult | string[] | void>`.
Object completions can specify `{ result: string[], matched?: string }`; arrays replace the complete
question input. Password input disables completion and hides characters and redraws on TTYs, not in pipes.

Instance calls are only allowed while a command is running. Calls made at the command prompt, before
starting, or concurrently reject. The static method delegates to the active instance; when no instance
is active it creates a temporary interface and closes it after one answer. Ctrl+C or EOF rejects with
the exported `REPLInputCancelledError`. EOF also closes the main REPL.

Question input never consumes already queued command lines or a partial command: the partial line
and cursor are saved, then restored after the question. Questions have isolated empty history; neither
answers nor passwords enter command history or its file. If pasting several lines into a question,
only its first answer belongs to that question; later lines become queued command input.

## Options

| Option            | Behavior                                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokenizer`       | Default `CommandArgsTokenizer.simple`; commands may override it in their metadata.                                                                                     |
| `looseCmdName`    | Accept arbitrary non-whitespace command names; default `false`.                                                                                                        |
| `statusLine`      | Getter returning `string \| null \| undefined`, evaluated for each new prompt. Empty values hide the status. TTY only; CR/LF become spaces. Readline handles wrapping. |
| `history`         | Optional `{ filePath, limit?, onError? }`; no file is written unless configured. The containing directory must already exist.                                          |
| `onExit`          | Exit callback; defaults to `process.exit(0)`.                                                                                                                          |
| `input`, `output` | Caller-owned streams; default `process.stdin` and `process.stdout`. TTY mode follows `output.isTTY`.                                                                   |

`repl.refreshPrompt()` updates the status and prompt while waiting for a command, preserving typed
input and cursor. It does nothing during commands or questions. Override `buildReplPrompt()` to customize
the command prompt. `active()` selects the instance used by static loggers and questions.

History defaults to the most recent 1000 entries. On startup oversized files are truncated, and history
is restored for Up/Down navigation. Only accepted command lines are recorded: blank input, lines beginning
with a space, and consecutive duplicates are excluded from both memory and disk. New history files use
permissions `0600`; existing permissions are not changed. Files are capped on the next startup, not on
every append. File errors invoke `onError({ operation, filePath, error })`; without a callback the REPL warns
once and continues. Treat command arguments as potentially sensitive and use a leading space or questions
for secrets.

## Other exports

- Commands: `CommandHelp` (`help`/`?`, accepts optional extra help text), `CommandExit` (`exit`) and
  `CommandSet` (`set`/`unset` for a `VarResolver`, e.g. `DefaultVarResolver`).
- Arguments: `CommandArgs` and `CommandArgsTokenizer` (`simple` splits on whitespace, `unix` supports quotes),
  plus `DefaultArgsParser` for option-style arguments with completion.
- Completion: `completeKeyword(str, keywords)`, `completePath(input, cwd?, options?)`, `normalizeCompletion`
  and `CommandCompleter`; these modules do not depend on `node:readline`.
- Readline building blocks: `LineReader`, `PausableOutputStream`, `loadHistoryFile`, `HistoryFileWriter` and
  `REPLInputCancelledError`, for embedding the line editor without the `REPL` command loop.

## Breaking changes in 4.0.0

- `SharedDataBase.repl` and all `REPLServer` exposure have been removed.
- `start()` now returns a promise, and there are no `node:repl` dot commands or JavaScript evaluation.
- `.exit`, `exit` and `quit` are not implicit exit commands. Register `CommandExit` for `exit`.
- `REPL.COMMANDS_EXIT` has been removed; exit handlers use the exported `SYMBOL_EXIT`.
- Redirected output runs in non-TTY mode rather than forcing interactive terminal redraw.

## Development and example

```bash
bun run build
bun run lint
bun test src
node esm/tests/index.js
bun src/tests/index.ts
```

The example registers `help`, `exit`, `login`, `set`/`unset`, `echo`, `pwd`, `cd`, `ls`/`ll`, `args` and
`timer start|stop`, using `CommandArgsTokenizer.unix`. It displays the current directory and time, refreshes its
status during timer notifications, and saves history to `tmp/repl-history` in this package (the directory is
created automatically). Set `REPL_HISTORY_FILE` to use a different file in an existing directory.
`login` demonstrates username completion and a hidden password; it does not authenticate with a server.
