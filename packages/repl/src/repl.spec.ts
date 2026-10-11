import { describe, it } from "bun:test";
import { deepStrictEqual, match, ok, rejects, strictEqual } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
//
import { CommandExit } from "./defaults/cmd-exit.js";
import { createFakeTTY } from "./readline/__tests__/fake-tty.js";
import { REPL } from "./repl.js";
//
import type { CommandContext, CommandInterface } from "./types.js";

describe("REPL integration", () => {
  function command(onCommand: CommandInterface["onCommand"]): CommandInterface {
    return { getMeta: () => ({ match: ["run"], usage: [] }), onCommand };
  }
  function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
      resolve = done;
    });
    return { promise, resolve };
  }

  it("reads standalone input and rejects concurrent static questions", () => {
    const moduleURL = new URL("./repl.js", import.meta.url).href;
    const source = `
      import { REPL } from ${JSON.stringify(moduleURL)};
      const first = REPL.inputLine({ prompt: "Standalone: " });
      try {
        await REPL.inputLine();
        throw new Error("Concurrent question was accepted");
      } catch (error) {
        if (error.message !== "An inputLine() call is already pending") throw error;
      }
      const answer = await first;
      console.log("ANSWER=" + answer);
    `;
    const args = process.versions.bun ? ["--eval", source] : ["--input-type=module", "--eval", source];
    const result = spawnSync(process.execPath, args, { input: "value\n", encoding: "utf8", timeout: 5000 });
    strictEqual(result.status, 0, result.stderr || result.error?.message);
    match(result.stdout, /ANSWER=value/);
  });

  it("executes busy type-ahead FIFO and preserves the partial line and cursor", async () => {
    const tty = createFakeTTY();
    const gate = deferred();
    const calls: string[] = [];
    let exits = 0;
    const repl = new REPL(
      [
        command(async (_name, args) => {
          calls.push(args.getStr(0)!);
          if (calls.length === 1) await gate.promise;
        }),
        new CommandExit(),
      ],
      undefined,
      {
        ...tty,
        onExit: () => {
          exits++;
        },
      }
    );
    const finished = repl.start();
    try {
      await tty.type("run first\r");
      tty.clearOutput();
      await tty.type("run second\rrun third\rpart\x1b[D");
      match(tty.getOutput(), /part/);
      deepStrictEqual(calls, ["first"]);
      gate.resolve();
      await tty.type("");
      deepStrictEqual(calls, ["first", "second", "third"]);
      await tty.type("\x1b[F\x15exit\r");
      await finished;
      strictEqual(exits, 1);
    } finally {
      gate.resolve();
      tty.input.end();
      await finished;
    }
  });

  it("aborts a running command on the first interrupt and force-exits on the second", async () => {
    const tty = createFakeTTY();
    const gate = deferred();
    let context: CommandContext | undefined;
    let exits = 0;
    const repl = new REPL(
      [
        command(async (_name, _args, ctx) => {
          context = ctx;
          await gate.promise;
        }),
      ],
      undefined,
      {
        ...tty,
        onExit: () => {
          exits++;
        },
      }
    );
    const finished = repl.start();
    try {
      await tty.type("run\r");
      ok(context);
      await tty.type("\x03");
      strictEqual(context.signal.aborted, true);
      strictEqual(exits, 0);
      match(tty.getOutput(), /\^C/);
      await tty.type("\x03");
      await finished;
      strictEqual(exits, 1);
    } finally {
      gate.resolve();
      tty.input.end();
      await finished;
    }
  });

  it("delivers interrupts received in the same chunk as the command", async () => {
    const tty = createFakeTTY();
    let aborted = false;
    const finished = new REPL(
      [
        command(async (_name, _args, ctx) => {
          aborted = ctx!.signal.aborted;
        }),
        new CommandExit(),
      ],
      undefined,
      { ...tty, onExit: () => {} }
    ).start();
    try {
      await tty.type("run\r\x03");
      strictEqual(aborted, true);
      await tty.type("exit\r");
      await finished;
    } finally {
      tty.input.end();
      await finished;
    }
  });

  it("handles EOF during a running command without dropping queued input", async () => {
    const tty = createFakeTTY({ terminal: false });
    const gate = deferred();
    const calls: string[] = [];
    const finished = new REPL(
      [
        command(async (_name, args) => {
          calls.push(args.getStr(0)!);
          if (calls.length === 1) await gate.promise;
        }),
      ],
      undefined,
      { ...tty, onExit: () => {} }
    ).start();
    try {
      await tty.type("run first\n");
      tty.input.end("run second\nrun third");
      await new Promise<void>((resolve) => setImmediate(resolve));
      deepStrictEqual(calls, ["first"]);
      gate.resolve();
      await finished;
      deepStrictEqual(calls, ["first", "second", "third"]);
    } finally {
      gate.resolve();
      tty.input.end();
      await finished;
    }
  });

  it("warns once for default history errors and keeps executing commands", async () => {
    const tty = createFakeTTY({ terminal: false });
    const dir = mkdtempSync(join(tmpdir(), "repl-history-errors-"));
    let warnings = 0;
    let calls = 0;
    const warn = console.warn;
    console.warn = () => {
      warnings++;
    };
    try {
      const finished = new REPL(
        [
          command(async () => {
            calls++;
          }),
        ],
        undefined,
        {
          ...tty,
          history: { filePath: dir },
          onExit: () => {},
        }
      ).start();
      tty.input.end("run\nrun next\n");
      await finished;
      strictEqual(warnings, 1);
      strictEqual(calls, 2);
    } finally {
      console.warn = warn;
      tty.input.end();
      rmSync(dir, { recursive: true });
    }
  });

  it("recomputes status without changing pending input and suppresses it in pipes", async () => {
    const tty = createFakeTTY();
    let status = "initial\r\nstatus";
    const repl = new REPL([new CommandExit()], undefined, {
      ...tty,
      statusLine: () => status,
      onExit: () => {},
    });
    const finished = repl.start();
    try {
      await tty.type("ex");
      match(tty.getOutput(), /initial {2}status/);
      status = "updated";
      repl.refreshPrompt();
      await tty.type("it\r");
      await finished;
      match(tty.getOutput(), /updated/);
    } finally {
      tty.input.end();
      await finished;
    }
    const pipe = createFakeTTY({ terminal: false });
    const piped = new REPL([new CommandExit()], undefined, {
      ...pipe,
      statusLine: () => {
        throw new Error("Must not run in a pipe");
      },
      onExit: () => {},
    }).start();
    pipe.input.end("exit\n");
    await piped;
    strictEqual(pipe.getOutput().includes("updated"), false);
  });

  it("drains all piped commands after EOF and invokes onExit once", async () => {
    const tty = createFakeTTY({ terminal: false });
    const calls: string[] = [];
    let exits = 0;
    const finished = new REPL(
      [
        command(async (_name, args) => {
          calls.push(args.getStr(0)!);
        }),
      ],
      undefined,
      {
        ...tty,
        onExit: () => {
          exits++;
        },
      }
    ).start();
    tty.input.end("run one\nrun two\nrun three");
    await finished;
    deepStrictEqual(calls, ["one", "two", "three"]);
    strictEqual(exits, 1);
  });

  it("restores persistent history and excludes questions and passwords", async () => {
    const dir = mkdtempSync(join(tmpdir(), "repl-integration-"));
    const filePath = join(dir, "history");
    writeFileSync(filePath, "run previous\n");
    const tty = createFakeTTY();
    let username = "";
    let password = "";
    const repl = new REPL(
      [
        command(async () => {
          username = await REPL.inputLine({ prompt: "Name: " });
          password = await repl.inputLine({ prompt: "Password: ", password: true });
        }),
        new CommandExit(),
      ],
      undefined,
      { ...tty, history: { filePath }, onExit: () => {} }
    );
    const finished = repl.start();
    try {
      await rejects(repl.inputLine(), /only be called while a command is running/);
      await tty.type("\x1b[A\r");
      await tty.type("alice\r");
      await tty.type("top-secret\r");
      await tty.type("exit\r");
      await finished;
      strictEqual(username, "alice");
      strictEqual(password, "top-secret");
      strictEqual(tty.getOutput().includes("top-secret"), false);
      strictEqual(readFileSync(filePath, "utf8"), "run previous\nexit\n");
    } finally {
      tty.input.end();
      await finished;
      rmSync(dir, { recursive: true });
    }
  });

  it("has no implicit exit or JavaScript evaluation and permits custom exit handlers", async () => {
    const tty = createFakeTTY({ terminal: false });
    const names: string[] = [];
    const custom: CommandInterface = {
      getMeta: () => ({ match: ["exit", "quit"], usage: [] }),
      onCommand: async (name) => {
        names.push(name);
      },
    };
    const log = console.error;
    const errors: string[] = [];
    console.error = (...args) => {
      errors.push(args.join(" "));
    };
    try {
      const finished = new REPL([custom], undefined, { ...tty, onExit: () => {} }).start();
      tty.input.end("exit\nquit\n.exit\n1+1\n");
      await finished;
      deepStrictEqual(names, ["exit", "quit"]);
      ok(errors.some((line) => line.includes('Unknown command: ".exit"')));
    } finally {
      console.error = log;
      tty.input.end();
    }
  });
});
