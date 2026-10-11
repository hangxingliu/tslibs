/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { BASIC_COLORS } from "../contrib/colors-base.js";
import { ANSI_REGEXP_ALL } from "../contrib/shell-ansi-regex.js";
//
import type { CommandArgs } from "../tokenizer/index.js";
import type { CommandInterface, CommandMeta, SharedDataBase } from "../types.js";
import { CommandFlags } from "../types.js";
//
const { BOLD, DIM, RESET } = BASIC_COLORS;

type PrintLine = "" | ({ right: string } & ({ left: string } | { cmd: string; args: string }));

export type CommandHelpOptions = {
  /** Extra text printed after the overview of all commands */
  extraHelp?: string;
  /**
   * Print the overview of all commands without blank lines between commands.
   * Useful for REPLs with only a few simple commands.
   * @default false
   */
  compact?: boolean;
};

export class CommandHelp implements CommandInterface {
  extraHelp?: string;
  compact: boolean;

  constructor(extraHelpOrOptions?: string | Readonly<CommandHelpOptions>) {
    const options = typeof extraHelpOrOptions === "string" ? { extraHelp: extraHelpOrOptions } : extraHelpOrOptions;
    this.extraHelp = options?.extraHelp;
    this.compact = options?.compact === true;
  }

  private sharedData?: SharedDataBase;
  connect(sharedData: SharedDataBase) {
    this.sharedData = sharedData;
  }

  getMeta(): CommandMeta {
    return {
      flag: CommandFlags.help,
      match: ["help", "?"],
      description: "Print usage for the command or overview of all commands",
      usage: [`help [command]`],
    };
  }

  async onCommand(cmdName: string, args: CommandArgs): Promise<any> {
    const command = args.getStr(0);
    const { sharedData } = this;
    if (!sharedData) return;

    const { commandMetas: metas } = sharedData;
    if (command) {
      const meta = metas.find((it) => it.match && it.match.includes(command));
      if (!meta) throw new Error(`Unknown command: ${command}`);

      const lines = alignLines(usageToLines(meta.usage));
      for (let i = 0; i < lines.length; i++) {
        if (i === 0) console.log(`Usage: ${lines[i]}`);
        else console.log(`       ${lines[i]}`);
      }
      if (meta.description) printSection("Description", meta.description);
      if (meta.docs) {
        Object.entries(meta.docs).forEach(([title, text]) =>
          printSection(title[0].toUpperCase() + title.slice(1), text)
        );
      }
      return;
    }

    const allLines: PrintLine[] = [];
    for (const meta of metas) {
      const { description, usage } = meta;
      const lines = usageToLines(usage, description);
      if (lines.length === 0) continue;
      if (allLines.length > 0 && !this.compact) allLines.push("");
      allLines.push(...lines);
    }

    for (const line of alignLines(allLines)) console.log(line);
    if (this.extraHelp) console.log(`\n${this.extraHelp}`);
  }

  async onCompletion(cmdName: string, cmd: CommandArgs) {
    if (!this.sharedData) return;
    const { completionIndex } = cmd;
    // first arg
    if (completionIndex === 0) {
      const { commandMetas: metas } = this.sharedData;
      const commands: string[] = [];
      for (const meta of metas) {
        if (!meta.match) continue;
        for (const match of meta.match) commands.push(`${match} `);
      }
      const text = cmd.getStr(completionIndex);
      if (text) return commands.filter((it) => it.startsWith(text));
      return commands;
    }
  }
}

function printSection(title: string, text: string) {
  const lines = text.split("\n");
  // if (lines.length === 1) return console.log(`\n${title}: ${lines[0]}`);
  console.log(`\n${title}:`);
  for (const line of lines) console.log(`       ${line}`);
}

function usageToLines(usages: CommandMeta["usage"], description?: string) {
  const lines: PrintLine[] = [];
  const hasAnyRight = usages.some((it) => Array.isArray(it) && it[1]);

  for (let i = 0; i < usages.length; i++) {
    const it = usages[i];
    const split = splitCmdArgs(typeof it === "string" ? it : it[0]);
    let right = typeof it === "string" ? "" : it[1];
    if (i === 0 && description && !hasAnyRight) right = description;

    if (split.cmd) lines.push({ cmd: split.cmd, args: split.args || "", right });
    else lines.push({ left: split.raw, right });
  }
  return lines;
}

function splitCmdArgs(leftPart: string): { raw: string; cmd?: string; args?: string } {
  leftPart = leftPart.trim();
  const matched = leftPart.match(/\s+/);
  if (!matched) return { raw: leftPart };
  return {
    raw: leftPart,
    cmd: leftPart.slice(0, matched.index!),
    args: leftPart.slice(matched.index! + matched[0].length),
  };
}

function alignLines(lines: ReadonlyArray<PrintLine>) {
  let maxCmdWidth = 4;
  let maxArgsWidth = 6;
  let maxLeftWidth = 16;
  const GAP_AFTER_CMD = " ";

  const widths: [w0: number, w1: number][] = [];
  for (const line of lines) {
    if (!line) {
      widths.push([0, 0]);
      continue;
    }

    if ("left" in line) {
      const leftWidth = line.left.replace(ANSI_REGEXP_ALL, "").length;
      if (leftWidth > maxLeftWidth) maxLeftWidth = leftWidth;
      widths.push([leftWidth, 0]);
    } else {
      const { cmd, args } = line;
      const cmdWidth = cmd.replace(ANSI_REGEXP_ALL, "").length;
      const argsWidth = args.replace(ANSI_REGEXP_ALL, "").length;

      if (cmdWidth > maxCmdWidth) maxCmdWidth = cmdWidth;
      if (argsWidth > maxArgsWidth) maxArgsWidth = argsWidth;
      widths.push([cmdWidth, argsWidth]);
    }
  }

  maxLeftWidth = Math.max(maxLeftWidth, maxCmdWidth + GAP_AFTER_CMD.length + maxArgsWidth);

  const results: string[] = [];
  const leftPlaceholder = "".padEnd(maxLeftWidth);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      results.push("");
      continue;
    }

    const [w0, w1] = widths[i];
    if ("left" in line) {
      const result = addWhitespaces(line.left, maxLeftWidth - w0);
      if (line.right) {
        const rightLines = line.right.split("\n");
        for (let i = 0; i < rightLines.length; i++)
          results.push((i === 0 ? result : leftPlaceholder) + "  " + DIM + rightLines[i] + RESET);
      } else {
        results.push(result);
      }
      continue;
    }
    //
    const { cmd, args } = line;

    let result = addWhitespaces(cmd, maxCmdWidth - w0);
    result = BOLD + result + RESET;
    result += GAP_AFTER_CMD + addWhitespaces(args, maxArgsWidth - w1);

    if (line.right) {
      const rightLines = line.right.split("\n");
      for (let i = 0; i < rightLines.length; i++)
        results.push((i === 0 ? result : leftPlaceholder) + "  " + DIM + rightLines[i] + RESET);
    } else {
      results.push(result);
    }
  }
  return results;
}

function addWhitespaces(str: string, count: number) {
  if (count <= 0) return str;
  return str + "".padEnd(count);
}
