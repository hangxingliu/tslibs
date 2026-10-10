/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { inspect } from "util";
import type { CommandArgs } from "../tokenizer/index.js";
import type { VarResolver } from "../tokenizer/types.js";
import type { CommandInterface, CommandMeta } from "../types.js";
import { SharedDataBase, SYMBOL_PRINT_HELP } from "../types.js";

export class CommandSet implements CommandInterface {
  constructor(readonly vars: VarResolver) {}
  getMeta(): CommandMeta {
    return {
      match: ["set", "unset"],
      description: "Set, unset or list variables",
      usage: [
        //
        [`set [-s|-l [keyword]]`, `list variables`],
        [`set [<var> <value>]`, `set variable`],
        `unset <...vars>`,
      ],
    };
  }

  async onCommand(cmdName: string, args: CommandArgs): Promise<any> {
    if (cmdName === "set") {
      let listMode = false;
      const varName = args.getStr(0);
      let keyword: string | undefined;
      if (args.length > 0 && (varName === "-s" || varName === "-l")) {
        keyword = args.getStr(2);
        listMode = true;
      } else if (args.length === 0) {
        listMode = true;
      }

      if (listMode) {
        const width = Math.max(process.stdout.columns || 0, 128);
        const keys = this.vars.keys(keyword);
        for (const key of keys) {
          const prefix = `${key} = `;
          const val = this.vars.get(key);
          let valStr: string;
          switch (typeof val) {
            case "function":
              valStr = `function ${(val as Function).name}`;
              break;
            case "string": {
              let maxWidth = width - prefix.length - 6;
              if (maxWidth < 32) maxWidth = 32;
              if (val.length > maxWidth) {
                valStr = JSON.stringify(val.slice(0, maxWidth)) + "...";
              } else {
                valStr = JSON.stringify(val);
              }
              break;
            }
            default:
              valStr = inspect(val, false, 1, true);
              break;
          }
          console.log(prefix + valStr);
        }
        return;
      }

      if (!varName) return SYMBOL_PRINT_HELP;

      const argVal = args.args[1];
      if (!argVal) return SYMBOL_PRINT_HELP;

      const val = args.getStr(1)!;
      const hasQuotes = argVal.range.findIndex((it) => it.quote) >= 0;
      const resolvedVal = hasQuotes ? val : resolveVal(val);
      this.vars.set?.(varName, resolvedVal);
      return;
    }

    if (cmdName === "unset") {
      const varNames = args.getRestStr(0);
      if (varNames.length === 0) return SYMBOL_PRINT_HELP;

      for (const varName of varNames) this.vars.delete?.(varName);
      return;
    }

    function resolveVal(val: string) {
      if (!val) return val;

      if (val.match(/^null$/i)) return null;
      if (val.match(/^undefined$/i)) return undefined;

      if (val.match(/^(true|yes)$/i)) return true;
      if (val.match(/^(false|no)$/i)) return false;
      let match = val.match(/^0x([0-9a-f]+)$/i);
      if (match) {
        const int = parseInt(match[1], 16);
        if (Number.isInteger(int)) return int;
      }

      match = val.match(/^(\-?[0-9,]+(?:\.[0-9]+)?)$/i);
      if (match) {
        const num = parseFloat(match[1].replace(/,/g, ""));
        if (!Number.isNaN(num)) return num;
      }

      if (val.length >= 2) {
        const lastIndex = val.length - 1;
        if ((val[0] === "[" && val[lastIndex] === "]") || (val[0] === "{" && val[lastIndex] === "}"))
          return JSON.parse(val);
      }

      return val;
    }
  }

  async onCompletion(cmdName: string, cmd: CommandArgs) {
    const { index, str } = cmd.completionContext;
    if (index === 0) {
      const keys = this.vars.keys(str);
      if (cmdName === "set") if (!str || str.startsWith("-")) keys.push("-l");
      return keys;
    }
  }
}
