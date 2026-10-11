import { deepStrictEqual, rejects } from "node:assert";
import { DefaultVarResolver } from "../defaults/vars.js";
import { CommandArgsTokenizer } from "../tokenizer/types.js";
import type { CommandInterface } from "../types.js";
import { CommandCompleter } from "./command-completer.js";
import type { CompletableCommand, CompletionResult } from "./types.js";

describe("CommandCompleter", () => {
  function create(completion?: CompletionResult | string[]) {
    const handler: CommandInterface = {
      getMeta: () => ({ match: ["echo"], usage: [] }),
      onCommand: async () => {},
      onCompletion: async () => completion,
    };
    const resolver = new DefaultVarResolver(new Map([["hello", "world"]]));
    return new CommandCompleter({
      commandNames: ["echo", "help"],
      commandsMap: new Map([["echo", handler]]),
      getTokenizer: () => CommandArgsTokenizer.unix,
      getVarResolver: () => resolver,
      looseCmdName: false,
    });
  }

  it("completes command names without evaluating JavaScript", async () => {
    deepStrictEqual(await create().complete("E"), [["echo "], "E"]);
    deepStrictEqual(await create().complete(""), [["echo ", "help "], ""]);
  });

  it("normalizes array and object argument completions", async () => {
    deepStrictEqual(await create(["value"]).complete("echo va"), [["value"], "va"]);
    deepStrictEqual(await create({ result: ["value"], matched: "custom" }).complete("echo va"), [["value"], "custom"]);
  });

  it("completes variables and unknown commands", async () => {
    deepStrictEqual(await create().complete("echo $he"), [["hello"], "he"]);
    deepStrictEqual(await create().complete("echo ${he"), [["hello}"], "he"]);
    deepStrictEqual(await create().complete("missing x"), [[], "missing x"]);
  });

  it("supports loose command names and propagates completion failures", async () => {
    const handler: CommandInterface = {
      getMeta: () => ({ usage: [] }),
      onCommand: async () => {},
      onCompletion: async () => {
        throw new Error("completion failed");
      },
    };
    const completer = new CommandCompleter({
      commandNames: ["foo.bar"],
      commandsMap: new Map([["foo.bar", handler]]),
      getTokenizer: () => CommandArgsTokenizer.simple,
      getVarResolver: () => undefined,
      looseCmdName: true,
    });
    deepStrictEqual(await completer.complete("foo."), [["foo.bar "], "foo."]);
    await rejects(completer.complete("foo.bar x"), /completion failed/);
  });

  it("accepts minimal completable commands that are not full REPL commands", async () => {
    const command: CompletableCommand = { onCompletion: async (_name, args) => [`${args.completionContext.str}!`] };
    const completer = new CommandCompleter({
      commandNames: ["run"],
      commandsMap: new Map([["run", command]]),
      getTokenizer: () => CommandArgsTokenizer.unix,
      getVarResolver: () => undefined,
      looseCmdName: false,
    });
    deepStrictEqual(await completer.complete("run ab"), [["ab!"], "ab"]);
    deepStrictEqual(await completer.complete("run "), [["!"], ""]);
  });
});
