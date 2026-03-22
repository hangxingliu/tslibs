/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { createReadStream, createWriteStream, type Stats, statSync } from "fs";
import { truncate } from "fs/promises";
import type { Writable } from "stream";
import { inspect } from "util";

const CLOSED_TAIL = Buffer.from("\n]");

export type JSONStringifyReplacer = (this: any, key: string, value: any) => any;

export class JSONStreamWriter<LogType = any> {
  static readonly defaultReplacers: JSONStringifyReplacer[] = [];

  private stream?: Writable;
  private count = 0;
  private exited = false;
  readonly replacers: JSONStringifyReplacer[] = [...JSONStreamWriter.defaultReplacers];

  constructor(
    readonly file: string,
    flags?: string
  ) {
    this.stream = createWriteStream(file, { flags });
    if (flags && flags.includes("a")) this.count = 1;
  }

  static async append(file: string) {
    let st: Stats | undefined;
    try {
      st = statSync(file);
    } catch {
      // ignore
    }
    if (st && !st.isFile()) throw new Error(`${file} is not file for writing JSON stream`);
    if (st && st.size >= 3) {
      const start = Math.max(st.size - 16, 0);
      const stream = createReadStream(file, { start });
      let trun = st.size;
      for await (const chunk of stream) {
        const index = (chunk as Buffer).lastIndexOf(CLOSED_TAIL);
        if (index >= 0) trun = st.size - (chunk as Buffer).length + index;
        break;
      }
      stream.close();
      if (trun < st.size) await truncate(file, trun);
    }
    return new JSONStreamWriter(file, st && st.size > 0 ? "a" : undefined);
  }

  write(data: LogType): void;
  write(data: LogType, encode: true): void;
  write(data: string, encode: false): void;
  write(data: LogType | string, encode?: boolean) {
    const stream = this.stream;
    if (!stream) return;
    stream.write(this.count++ == 0 ? `[\n` : `,\n`);
    if (encode !== false) {
      try {
        if (this.replacers.length === 0) {
          data = JSON.stringify(data);
        } else {
          const replacers = this.replacers;
          data = JSON.stringify(data, function replacer(key, value) {
            for (const r of replacers) {
              value = r.call(this, key, value);
              if (value === undefined) return value;
            }
            return value;
          });
        }
      } catch {
        data = inspect(data);
      }
    }
    stream.write(data);
  }

  close() {
    if (this.exited || !this.stream) return;
    this.exited = true;

    const stream = this.stream;
    delete this.stream;
    return new Promise<void>((resolve) => {
      if (this.count > 0) stream.write("\n]");
      stream.end(resolve);
    });
  }
}
