# `@hangxingliu/repl`

Readline-based command REPL for Node.js and Bun. `src/index.ts` re-exports every public module, and its
`@version` tag must match `package.json` (checked by `src/validate-version.spec.ts`). `src/contrib/` holds
vendored helpers (colors, ANSI regexp, shell escaping, argument parsing). `src/tests/` is the runnable example,
not a unit-test directory; it is excluded from the published package together with `*.spec.*` and `__tests__`.

## Layout

| Module                                    | Responsibility                                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `repl.ts`                                 | Registration, active instance, FIFO execution loop, interrupts, prompts, logging and public input APIs     |
| `repl-executor.ts`                        | `REPLExecutor`: command/fallback dispatch, help on `SYMBOL_PRINT_HELP`, result/error output, exit result   |
| `types.ts`                                | Public contracts (`CommandInterface`, `CommandMeta`, `CommandContext`, `REPLOptions`, `SharedDataBase`)    |
| `tokenizer/`                              | `CommandArgs`, `CommandArgsTokenizer` (`simple`/`unix`), `VarResolver`; `command-name.ts` has `getCmdName` |
| `complete/types.ts`                       | Editor-agnostic completion contracts (`CompletionResult`, `CompletionTuple`, `CompletableCommand`)         |
| `complete/normalize.ts`                   | Normalizes completer values (`string[]`/object/`void`) to `[candidates, matched]`                          |
| `complete/command-completer.ts`           | `CommandCompleter`: command name, variable and `onCompletion` argument completion                          |
| `complete/keyword.ts`, `complete/path.ts` | Public `completeKeyword` and `completePath` (Node file system) helpers                                     |
| `readline/index.ts`                       | `LineReader`: one interface, queued lines, questions, mode transitions and history isolation               |
| `readline/types.ts`                       | Reader/question/history option types, `LineReaderStatus` and `REPLInputCancelledError`                     |
| `readline/render-utils.ts`                | Clearing the full rendered input, including wrapped multiline prompts                                      |
| `readline/pausable-output-stream.ts`      | `PausableOutputStream`: output proxy, TTY dimensions, resize forwarding and password masking               |
| `readline/history-file.ts`                | Validated history limits, synchronous loading/truncation/appending, explicit error callbacks               |
| `defaults/cmd-help.ts`, `cmd-exit.ts`     | `CommandHelp` (`CommandFlags.help`, `extraHelp`/`compact`), opt-in `CommandExit` returning `SYMBOL_EXIT`   |
| `defaults/cmd-set.ts`, `vars.ts`          | `CommandSet` (`set`/`unset`) and the `DefaultVarResolver` variable store                                   |
| `defaults/args-parser*.ts`                | `DefaultArgsParser` for option-style command arguments                                                     |
| `defaults/error-handlers.ts`              | Default history error handler: warns once via `REPL.warn`                                                  |

## Invariants

- Layering is `repl` → `readline` → `complete` → `tokenizer`. `tokenizer/` is standalone (only `contrib/`),
  `complete/` may import `tokenizer/`, and `readline/` may import `complete/` (all may use `contrib/`).
  `tokenizer/` and `complete/` must not import `node:readline`, so a future web line editor can reuse them;
  `src/internal-dependencies.spec.ts` enforces this (if a violation must be kept, document it there and `.skip` the test). `CommandInterface` extends `CompletableCommand` instead.
- Modes are `prompt` (command completion), `busy` (visible type-ahead with no completion), and `input`
  (isolated question/completion; password input is muted). The explicit Q1 decision takes precedence
  over the original plan's muted-busy draft.
- Every accepted line is captured by an event listener and queued, not read with `question()`. The reader
  enters busy synchronously on line receipt so several lines in one input chunk cannot overwrite a pending read.
- The REPL loop executes FIFO, drains queued pipe input after EOF, and allocates an `AbortController` for
  each command. First busy Ctrl+C aborts; second force-exits. `onExit` is called once, defaulting to process exit.
- Prompt/status are composed as a multiline readline prompt; no width calculation or private symbol hooks.
  Only `render-utils.ts` accesses the undocumented `prevRows` property, resetting it after clearing/mode changes.
- Live output should use `REPL.log/error/warn`; raw console/stream writes cannot preserve live input rendering.
- Question setup saves partial input/cursor, installs empty history, and leaves the command queue untouched.
  Settlement restores state synchronously, before the next input event in the same chunk. A later pasted line
  belongs to the command queue, not to a not-yet-started second question.
- Password characters are dropped when entering `PausableOutputStream` (`paused`), not when its buffer drains, preventing
  leaks under backpressure. Completion is disabled; resize and logger redraw must never reveal the secret.
- Native history changes are discarded; only main-loop accepted commands are recorded. Memory and disk skip
  blank lines, space-prefixed lines and consecutive duplicates. History defaults to 1000, loads oldest-first,
  restores newest-first, truncates on startup, and creates files with `0600`. Only configured history persists.
- No `node:repl`, shared server handle, implicit exit command, or JavaScript evaluation. `CommandExit` is opt-in.
- `start()` is single-use and returns `Promise<void>`. Active static `inputLine` delegates; without an active
  instance it uses a temporary reader. Idle/concurrent questions reject, cancellation uses `REPLInputCancelledError`.

## Verification

Use `bun run build`, `bun run lint`, and `bun test src` in the package. Tests use existing `describe/it`
conventions and `node:assert` and can also run compiled under Node with test globals. Fake TTY tests cover
multiline/wrapped prompts, cursor preservation, type-ahead, FIFO, history, questions, password masking,
interrupts and EOF. Run the example under both Node and Bun when changing readline behavior.
