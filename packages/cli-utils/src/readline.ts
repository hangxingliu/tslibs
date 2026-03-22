/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { Completer } from "node:readline";
import { createInterface } from "node:readline";

export async function readLine(prompt = "Input > "): Promise<string> {
  const reader = createInterface(process.stdin, process.stdout);
  const line = await new Promise<string>((resolve) => reader.question(prompt, resolve));
  reader.close();
  return line;
}

export async function confirm(prompt: string, defaultValue: boolean) {
  let message = `${prompt.trimEnd()} `;
  if (defaultValue) message += `(Y/n) > `;
  else message += `(y/N) > `;

  const reader = createInterface(process.stdin, process.stdout, getCompleterFromWords(["yes", "no"]));
  const line = await new Promise<string>((resolve) => reader.question(message, resolve));
  reader.close();

  if (defaultValue) return /^no?\s*$/i.test(line) === false;
  return /^y(?:es)?\s*$/i.test(line);
}

export function getCompleterFromWords(words: string[]): Completer {
  const all = words.map((word) => ({ lc: word.toLowerCase(), word }));
  return function wordsCompleter(line: string) {
    const lc = line.toLowerCase();
    const macthed = lc.length > 0 ? all.filter((it) => it.lc.startsWith(lc)) : all;
    return [macthed.length ? macthed.map((it) => it.word).sort() : [], line];
  };
}
