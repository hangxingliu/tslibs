/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { Arg, ArgQuote, ArgRange } from "./types.js";
import { CommandArgsTokenizer } from "./types.js";

export class CommandArgsBase {
  readonly args: Arg[] = [];

  constructor(
    readonly raw: string,
    readonly tokenizer: CommandArgsTokenizer
  ) {
    let pending: Arg | undefined;
    let lastRange: ArgRange | undefined;
    const startNewArg = (index: number, quote?: ArgQuote) => {
      const range: ArgRange = { from: index, text: "" };
      pending = { text: "", from: index, range: [range] };
      if (quote) {
        range.quote = quote;
        pending.from -= quote.length;
      }
      lastRange = range;
    };
    const startNewRange = (index: number, quote?: ArgQuote) => {
      const range: ArgRange = { from: index, text: "" };
      if (quote) range.quote = quote;
      pending!.range.push(range);
      lastRange = range;
    };
    const endPendingRange = (index: number) => {
      if (!pending) return;
      lastRange!.to = index;
      lastRange = undefined;
    };
    const endPendingArg = (index: number) => {
      if (!pending) return;
      if (lastRange) lastRange.to = index;
      pending.to = index;
      this.args.push(pending);
      pending = undefined;
    };
    const addChar = (ch: string) => {
      pending!.text += ch;
      lastRange!.text += ch;
    };

    //
    // simple
    //
    if (tokenizer === CommandArgsTokenizer.simple) {
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        const isBlank = /^\s$/.test(ch);
        if (!pending) {
          if (!isBlank) startNewArg(i--);
          continue;
        }
        if (isBlank) endPendingArg(i);
        else addChar(ch);
      }
      endPendingArg(raw.length);
      return;
    }

    //
    // unix
    //
    if (tokenizer === CommandArgsTokenizer.unix) {
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        const isBlank = /^\s$/.test(ch);
        if (!pending) {
          if (isBlank) continue;
          if (ch === '"' || ch === "'") startNewArg(i + 1, ch);
          else startNewArg(i--);
          continue;
        }

        if (isBlank) {
          if (!lastRange || !lastRange.quote) endPendingArg(i);
          else addChar(ch);
          continue;
        }

        if (!lastRange) {
          if (ch === '"' || ch === "'") startNewRange(i + 1, ch);
          else startNewRange(i--);
          continue;
        }

        if (lastRange && ch === lastRange.quote) {
          endPendingRange(i);
          continue;
        }

        if (ch === "\\") {
          const allowEscape = !lastRange || lastRange.quote !== "'";
          if (allowEscape) {
            const nextCh = raw[++i];
            if (!nextCh) addChar(ch);
            else addChar(ch + nextCh);
            continue;
          }
        }

        if (ch === '"' || ch === "'") {
          startNewRange(i + 1, ch);
          continue;
        }

        addChar(ch);
      }
      endPendingArg(raw.length);
      return;
    }

    throw new Error(`Invalid tokenizer ${tokenizer}`);
  }
}
