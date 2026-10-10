/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { CommandArgs } from "../tokenizer/index.js";
import type { CompletionResult } from "../types.js";
import type { ArgsParserConfig, ParseArgsOptionDescriptor } from "./args-parser.types.js";
import type { ParsedOptions } from "../contrib/parse-args.js";

function isPromise(t: any): t is Promise<any> {
  return t && typeof t === "object" && "then" in t && typeof t.then === "function";
}
function callCompleter<Args extends any[]>(
  asyncMode: boolean,
  fn: (
    ...args: Args
  ) => void | undefined | null | string[] | CompletionResult | Promise<string[] | CompletionResult | undefined>,
  ...args: Args
): CompletionResult | Promise<CompletionResult> {
  const result = fn(...args);
  if (isPromise(result)) {
    if (!asyncMode) return { result: [] };
    return result.then((result) => {
      if (!result) return { result: [] };
      if (Array.isArray(result)) return { result };
      return result;
    });
  }
  if (!result) return { result: [] };
  if (Array.isArray(result)) return { result };
  return result as CompletionResult;
}

export class DefaultArgsParser<Config extends ArgsParserConfig> {
  private readonly nameToOption = new Map<string, ParseArgsOptionDescriptor & { name: string }>();

  constructor(readonly config: Config) {
    for (const [longName, option] of Object.entries(config.options)) {
      const optionNames = [`--${longName}`];
      if (option.short) optionNames.push(`-${option.short}`);
      if (option.aliases) optionNames.push(...option.aliases);
      for (const optionName of optionNames) {
        if (this.nameToOption.has(optionName)) throw new Error(`Duplicate option name "${optionName}"`);
        this.nameToOption.set(optionName, { ...option, name: longName });
      }
    }
  }

  parse(cmd: CommandArgs): { options: ParsedOptions<Config["options"]>; rest: string[] } {
    let restArgNum: [min: number, max: number];
    if (this.config.rest) restArgNum = [this.config.rest[0], this.config.rest[1] || Infinity];
    else restArgNum = [0, 0];

    let restMode = false;
    const rest: string[] = [];
    const addRestArg = (arg: string) => {
      if (rest.length >= restArgNum[1]) throw new Error(`Unknown argument "${arg}" (too many rest args)`);
      rest.push(arg);
    };

    const argValues = new Map<any, any>();
    for (let i = 0; i < cmd.length; i++) {
      const argFlag = cmd.getStr(i) || "";
      if (restMode) {
        addRestArg(argFlag);
        continue;
      }

      const thisArg = this.nameToOption.get(argFlag);
      if (!thisArg) {
        if (argFlag === "--") {
          restMode = true;
          continue;
        }
        if (argFlag.startsWith("--") || argFlag.match(/^\-\w$/)) throw new Error(`Unknown argument "${argFlag}"`);
        addRestArg(argFlag);
        continue;
      }

      const hasVal = thisArg.type !== "boolean";
      const exist = argValues.has(thisArg.name);
      if (exist && hasVal && !thisArg.multiple) throw new Error(`Duplicate argument "${argFlag}"`);
      if (!hasVal) {
        argValues.set(thisArg.name, true);
        continue;
      }

      i++;
      if (i >= cmd.length) throw new Error(`The argument "${argFlag}" requires value`);
      const val = cmd.getStr(i) || "";

      if (thisArg.multiple) {
        let list: string[] = [];
        if (exist) list = argValues.get(thisArg.name);
        else argValues.set(thisArg.name, list);
        list.push(val);
      } else {
        argValues.set(thisArg.name, val);
      }
    }

    if (rest.length < restArgNum[0]) throw new Error(`No enough rest args are provided [${restArgNum.join(", ")}]`);

    const parsedArgs: ParsedOptions<Config["options"]> = {} as any;
    argValues.forEach((v, k) => {
      (parsedArgs as any)[k] = v;
    });
    return { options: parsedArgs, rest };
  }

  complete(cmd: CommandArgs): CompletionResult | undefined;
  complete(cmd: CommandArgs, asyncMode: false): CompletionResult | undefined;
  complete(cmd: CommandArgs, asyncMode: true): Promise<CompletionResult | undefined>;
  complete(cmd: CommandArgs, asyncMode = false): Promise<CompletionResult | undefined> | CompletionResult | undefined {
    const context = cmd.completionContext;
    const leadingRestArgs: string[] = [];

    for (let i = 0; i < context.index; i++) {
      const arg = cmd.getStr(i);
      if (!arg) continue;

      const option = this.nameToOption.get(arg);
      if (option) {
        const hasVal = option.type !== "boolean";
        if (hasVal) {
          i++;
          if (i >= context.index) {
            if (!option.completer) return asyncMode ? Promise.resolve(undefined) : undefined;
            return callCompleter(asyncMode, option.completer, context.str, arg);
          }
        }
        continue;
      }

      if (arg === "--") {
        if (!this.config.restCompleter) return;
        for (let j = i + 1; j <= context.index; j++) {
          const restArg = cmd.getStr(j);
          if (j === context.index) {
            return callCompleter(asyncMode, this.config.restCompleter, context.str, leadingRestArgs);
          }
          leadingRestArgs.push(restArg || "");
        }
        return;
      }

      leadingRestArgs.push(arg);
    }

    let result: CompletionResult | Promise<CompletionResult>;
    if (this.config.restCompleter) {
      result = callCompleter(asyncMode, this.config.restCompleter, context.str, leadingRestArgs);
    } else {
      result = { result: [] };
    }

    const nameToOption = this.nameToOption;
    if (isPromise(result)) return result.then(filterResult);
    return filterResult(result);

    function filterResult(result: CompletionResult): CompletionResult {
      for (const key of nameToOption.keys()) {
        if (!key.startsWith(context.str)) continue;
        result.result.push(`${key} `);
      }
      return result;
    }
  }
}
