/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { CommandArgsBase } from "./base.js";
import type { ArgRange, ArgsCompletionContext, VarCompletionContext, VarResolver } from "./types.js";
import { CommandArgsTokenizer, VarResolverStrategy } from "./types.js";
import { parseUnixEscapeSeq } from "../contrib/shell-args-escape.js";

const VAR_REGEXP = /\$(?:(\?|\w+)|\{(.+?)\})/g;
const VAR_COMPLETION_REGEXP = /(\$\{?)([^\s\[\]\{\}]+)$/;

const _VAR_REGEXP_FULL = VAR_REGEXP.toString()
  .replace("/", "^")
  .replace(/\/.*?$/, "$");
const VAR_REGEXP_FULL = new RegExp(_VAR_REGEXP_FULL, "");

export type ArgDecodeRanges = Pick<ArgRange, "quote" | "text">[];

export class CommandArgs extends CommandArgsBase {
  private _varResolver?: VarResolver;
  enableVarResolver(resolver?: VarResolver) {
    this._varResolver = resolver;
  }

  get length() {
    return this.args.length;
  }

  //
  //#region completion
  get completionIndex() {
    const args = this.args;
    if (args.length === 0) return 0;
    const lastIndex = args.length - 1;
    const last = args[lastIndex];
    if (!last.to) return lastIndex;
    if (last.to >= this.raw.length) return lastIndex;
    return lastIndex + 1;
  }
  get completionContext(): ArgsCompletionContext {
    const index = this.completionIndex;
    const arg = this.args[index];
    if (!arg) return { index, str: "" };
    return { index, str: this.getStr(index)!, arg };
  }
  get varCompletionContext(): VarCompletionContext | undefined {
    const index = this.completionIndex;
    const arg = this.args[index];
    if (!arg) return;
    const lastPart = arg.range[arg.range.length - 1];
    if (!lastPart) return;
    const mtx = lastPart.text.match(VAR_COMPLETION_REGEXP);
    if (!mtx) return;
    const prefix: VarCompletionContext["prefix"] = mtx[1] as any;
    return { prefix, varName: mtx[2], suffix: prefix === "${" ? "}" : undefined };
  }
  //#endregion completion
  //

  //
  //#region decode
  readonly resolveVariables = (val: string): unknown => {
    if (!val) return val;

    const { _varResolver, resolveVariables } = this;
    if (!_varResolver) return val;

    if (_varResolver.strategy === VarResolverStrategy.full) {
      const mtx = val.match(VAR_REGEXP_FULL);
      if (!mtx) return val;
      return resolveValExpression(mtx[1]);
    }
    return val.replace(VAR_REGEXP, (_, varName) => resolveValExpression(varName));

    function resolveValExpression(varExpression: string) {
      const mtx = varExpression.match(/^(.+?)(?:$|\[(.+)$)/);
      if (!mtx) return;
      let [, name, args] = mtx;
      const val = _varResolver!.get(name);

      if (!args) return val;
      if (!args.endsWith("]")) throw new Error(`Invalid variable expression: "${varExpression}"`);

      args = args.slice(args.length - 1);
      if (args.match(/^\-?\d+$/)) return resolveNestedProp(varExpression, val, parseInt(args));

      if (!args.startsWith("$")) args = `\${${args}}`;
      return resolveNestedProp(varExpression, val, resolveVariables(args));
    }
    function resolveNestedProp(varExpression: string, arr: any, index: unknown) {
      if (typeof index === "number") {
        if (index < 0) {
          const len = val.length;
          if (typeof len === "number") index += len;
        }
        return arr[index];
      }
      if (typeof index === "string") return arr[index];
      throw new Error(`${typeof index} is invalid property name in variable expression: "${varExpression}"`);
    }
  };

  stringifyVariable(val: any): string {
    if (val === undefined || val === null) return "";
    if (Array.isArray(val)) return this.stringifyVariable(val[0]);

    const type = typeof val;
    if (type === "object") return JSON.stringify(type);
    if (type === "function") return val.name || "";
    return String(val);
  }

  decode(ranges: ArgDecodeRanges): Buffer | undefined;
  decode(ranges: ArgDecodeRanges, encoding: BufferEncoding): string | undefined;
  decode(ranges: ArgDecodeRanges, encoding?: BufferEncoding): Buffer | string | undefined {
    if (this.tokenizer === CommandArgsTokenizer.simple) {
      const firstRange = ranges[0] || { text: "" };
      if (encoding) return this.stringifyVariable(this.resolveVariables(firstRange.text));
      return Buffer.from(firstRange.text);
    }

    const buf: Buffer[] = [];
    for (const range of ranges)
      buf.push(range.quote !== "'" ? parseUnixEscapeSeq(range.text) : Buffer.from(range.text));
    if (encoding) return this.stringifyVariable(this.resolveVariables(Buffer.concat(buf).toString(encoding)));
    return Buffer.concat(buf);
  }
  //#endregion decode
  //

  //
  //#region getter
  getRaw(i: number): string | undefined {
    const arg = this.args[i];
    if (!arg) return;
    return arg.text;
  }

  get(i: number): Buffer | undefined;
  get(i: number, encoding: BufferEncoding): string | undefined;
  get(i: number, encoding?: BufferEncoding): Buffer | string | undefined {
    const arg = this.args[i];
    if (!arg) return;
    return this.decode(arg.range, encoding as any);
  }
  getStr(i: number): string | undefined {
    return this.get(i, "utf-8");
  }

  getRestStr(from = 0): string[] {
    const result: string[] = [];
    for (let i = from, i2 = this.length; i < i2; i++) {
      const arg = this.get(i, "utf-8");
      if (typeof arg === "string") result.push(arg);
    }
    return result;
  }

  getRequiredStr(index: number, name: string): string {
    const arg = this.getStr(index);
    if (!arg) throw new Error(`The required argument "${name}" is missing or empty`);
    return arg;
  }
  //#endregion getter
  //

  //
  //#region find
  /**
   * @param arg
   * @param from default: 0
   */
  find(needle: string | Buffer, from?: number) {
    if (typeof from !== "number" || !Number.isSafeInteger(from) || from < 0) from = 0;
    for (; from < this.args.length; from++) {
      const arg = this.args[from];
      if (typeof needle === "string") {
        if (needle === this.decode(arg.range, "utf-8")) return from;
        continue;
      }
      const buf = this.decode(arg.range);
      if (buf && buf.compare(needle) === 0) return from;
    }
    return -1;
  }
  /**
   * @param arg
   * @param from default: 0
   */
  findOneOf(needle: string[] | Buffer[], from?: number) {
    if (needle.length === 0) return -1;
    const isStr = typeof needle[0] === "string";
    if (typeof from !== "number" || !Number.isSafeInteger(from) || from < 0) from = 0;
    for (; from < this.args.length; from++) {
      const arg = this.args[from];
      if (isStr) {
        const str = this.decode(arg.range, "utf-8");
        if (str && (needle as string[]).includes(str)) return from;
        continue;
      }
      const buf = this.decode(arg.range);
      if (!buf) continue;
      for (let i = 0; i < needle.length; i++) {
        const needleBuf = needle[i] as Buffer;
        if (buf.compare(needleBuf) === 0) return from;
      }
    }
    return -1;
  }
  //#endregion find
  //
}
