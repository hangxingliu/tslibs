import { describe, it } from "bun:test";
import { deepStrictEqual, strictEqual, match } from "node:assert";
import { CommandExit } from "./defaults/cmd-exit.js";
import { REPLExecutor } from "./repl-executor.js";
import { CommandArgsTokenizer } from "./tokenizer/types.js";
import { SYMBOL_PRINT_HELP, type CommandInterface, type SharedDataBase } from "./types.js";

describe("REPLExecutor", () => {
  const ctx = { signal: new AbortController().signal };
  function create(handler?: CommandInterface, fallbackHandler?: CommandInterface, helpHandler?: CommandInterface) {
    const sharedData: SharedDataBase = { commandMetas: [], lastResult: "previous" };
    return {
      sharedData,
      executor: new REPLExecutor({
        commandsMap: new Map(handler ? [["test", handler]] : []),
        commandNames: ["test"],
        sharedData,
        getTokenizer: () => CommandArgsTokenizer.unix,
        getVarResolver: () => undefined,
        looseCmdName: false,
        fallbackHandler,
        helpHandler,
      }),
    };
  }

  async function capture(action: () => Promise<unknown>) {
    const logs: unknown[][] = [];
    const errors: unknown[][] = [];
    const log = console.log;
    const error = console.error;
    console.log = (...args) => {
      logs.push(args);
    };
    console.error = (...args) => {
      errors.push(args);
    };
    try {
      await action();
    } finally {
      console.log = log;
      console.error = error;
    }
    return { logs, errors };
  }

  it("executes arguments with context, prints results and updates shared data", async () => {
    const handler: CommandInterface = {
      getMeta: () => ({ usage: [] }),
      onCommand: async (name, args, context) => {
        strictEqual(name, "test");
        strictEqual(args.getStr(0), "a b");
        strictEqual(context, ctx);
        return { value: 42 };
      },
    };
    const { executor, sharedData } = create(handler);
    const output = await capture(() => executor.execute('test "a b"', ctx));
    deepStrictEqual(sharedData.lastResult, { value: 42 });
    match(String(output.logs[0][0]), /value: 42/);
  });

  it("reports thrown values and unknown commands", async () => {
    const handler: CommandInterface = {
      getMeta: () => ({ usage: [] }),
      onCommand: async () => {
        throw new Error("failure");
      },
    };
    const { executor, sharedData } = create(handler);
    const output = await capture(() => executor.execute("test", ctx));
    strictEqual(output.errors.length, 2);
    strictEqual(sharedData.lastResult, "previous");
    const unknown = await capture(() => create().executor.execute("missing", ctx));
    match(String(unknown.errors[0][0]), /Unknown command/);
    const dot = await capture(() => create().executor.execute(".exit", ctx));
    match(String(dot.errors[0][0]), /Unknown command/);
  });

  it("handles fallback, help requests and undefined results", async () => {
    const calls: string[] = [];
    const fallback: CommandInterface = {
      getMeta: () => ({ usage: [] }),
      onCommand: async (name) => {
        calls.push(name);
        return SYMBOL_PRINT_HELP;
      },
    };
    const help: CommandInterface = {
      getMeta: () => ({ match: ["help"], usage: [] }),
      onCommand: async (_name, args) => {
        calls.push(args.getStr(0) ?? "overview");
      },
    };
    const { executor, sharedData } = create(undefined, fallback, help);
    await executor.execute("missing", ctx);
    deepStrictEqual(calls, ["missing", "overview"]);
    strictEqual(sharedData.lastResult, undefined);
    await create(fallback, undefined, help).executor.execute("test", ctx);
    deepStrictEqual(calls.slice(-2), ["test", "test"]);
  });

  it("only exits through an explicitly registered exit handler", async () => {
    const { executor } = create(new CommandExit());
    deepStrictEqual(await executor.execute("test", ctx), { exit: true });
    const output = await capture(() => executor.execute("exit", ctx));
    match(String(output.errors[0][0]), /Unknown command/);
  });
});
