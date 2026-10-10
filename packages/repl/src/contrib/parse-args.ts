/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { basename } from "node:path";
import {
  parseArgs,
  type ParseArgsConfig,
  type ParseArgsOptionDescriptor as _ParseArgsOptionDescriptor,
} from "node:util";

type _Multiple<Multiple extends boolean | undefined, Value> = Multiple extends true ? Value[] : Value;
type _Default<Default, Value> = Default extends undefined ? Value : Value | undefined;

type _ParsedValueInOption<Option extends ParseArgsOptionDescriptor> = Option["type"] extends "boolean"
  ? boolean
  : Option["type"] extends "string"
    ? string
    : unknown;

type ParsedValueInOption<Option extends ParseArgsOptionDescriptor> = _Default<
  Option["default"],
  _Multiple<Option["multiple"], _ParsedValueInOption<Option>>
>;

export type ParseArgsOptionDescriptor = _ParseArgsOptionDescriptor & {
  help?: string;
  /** param name */
  param?: string;
};

export type ParseArgsOptionsConfig = {
  [longOption: string]: ParseArgsOptionDescriptor;
};

export type ParsedOptions<T extends ParseArgsOptionsConfig> = {
  [optionName in keyof T]: ParsedValueInOption<T[optionName]>;
};

export type GenHelpTextOptions = {
  indent?: string;
  maxLeftWidth?: number;
  minLeftWidth?: number;
};

const DEFAULT_GEN_HELP_TEXT_OPTIONS = {
  indent: "  ",
  maxLeftWidth: 42,
  minLeftWidth: 24,
} as const satisfies Required<GenHelpTextOptions>;

export function generateHelpTextForOptions(options: ParseArgsOptionsConfig, _genOptions?: GenHelpTextOptions) {
  const genOptions = Object.assign({}, DEFAULT_GEN_HELP_TEXT_OPTIONS, _genOptions || {});

  let leftWidth = 0;
  const left: string[] = [];
  const right: string[] = [];

  for (const [key, value] of Object.entries(options)) {
    let leftPart = genOptions.indent;
    if ("short" in value && value.short) leftPart += `-${value.short}, `;
    else leftPart += `    `;
    leftPart += `--${key}`;

    // Add parameter placeholder if it's not a boolean option
    if (value.type !== "boolean") {
      const paramName = value.param || (value.multiple ? "list" : "str");
      leftPart += ` <${paramName}>`;
    }

    left.push(leftPart);
    right.push(value.help || "");
    if (leftPart.length > leftWidth) leftWidth = leftPart.length;
  }
  if (leftWidth > genOptions.maxLeftWidth) leftWidth = genOptions.maxLeftWidth;
  if (leftWidth < genOptions.minLeftWidth) leftWidth = genOptions.minLeftWidth;

  const lines: string[] = [];
  const spaces = new Array(leftWidth).fill(" ").join("");
  for (let i = 0; i < left.length; i++) {
    if (left[i].length > leftWidth) {
      // If the left part is too long, put help text on next line
      lines.push(left[i]);
      if (right[i]) lines.push(spaces + "  " + right[i]);
    } else {
      // Pad and add help text on same line
      let line = left[i].padEnd(leftWidth);
      if (right[i]) line += "  " + right[i];
      lines.push(line);
    }
  }

  return lines.join("\n");
}

export type ParseCliArgsConfig<Options extends ParseArgsOptionsConfig> = Pick<
  ParseArgsConfig,
  "args" | "strict" | "allowPositionals" | "allowNegative"
> & {
  options?: Options;
  version?: string;
  indent?: string;
  genUsage?: (config: ParseCliArgsConfig<Options>) => string;
  genHelp?: (helpText: string[], config: ParseCliArgsConfig<Options>) => string[];
};

export type ParsedCliArgs<Options extends ParseArgsOptionsConfig> = {
  options: ParsedOptions<Options>;
  args: string[];
  printHelp: (autoExit?: boolean) => void;
};

export function parseCliArgs<Options extends ParseArgsOptionsConfig>(
  config: ParseCliArgsConfig<Options>
): ParsedCliArgs<Options>;
export function parseCliArgs<Options extends ParseArgsOptionsConfig>(
  config: ParseCliArgsConfig<Options>,
  autoExit: true
): ParsedCliArgs<Options>;
export function parseCliArgs<Options extends ParseArgsOptionsConfig>(
  config: ParseCliArgsConfig<Options>,
  autoExit: false
): ParsedCliArgs<Options> | undefined;
export function parseCliArgs<Options extends ParseArgsOptionsConfig>(
  config: ParseCliArgsConfig<Options>,
  autoExit?: boolean
): ParsedCliArgs<Options> | undefined {
  const hasVersion = config.version ? true : false;
  if (hasVersion && config.options?.["version"]) throw new Error(`Duplicate option name '--version'`);
  if (config.options?.["help"]) throw new Error(`Duplicate option name '--help'`);

  const allowPositionals = config.allowPositionals ?? true;
  const extraOptions: ParseArgsOptionsConfig = {
    ...(hasVersion ? { version: { short: "V", type: "boolean", help: "print version" } } : {}),
    help: { short: "h", type: "boolean", help: "print command line options" },
  };

  const parsed = parseArgs({
    options: {
      ...(config.options || {}),
      ...extraOptions,
    },
    allowPositionals,
    allowNegative: config.allowNegative ?? false,
    strict: config.strict ?? true,
    args: config.args,
  });
  if (parsed.values.help) {
    printHelp(autoExit ?? true);
    return;
  }
  if (hasVersion && parsed.values.version) {
    process.stdout.write(config.version + "\n");
    if (autoExit !== false) process.exit(0);
    return;
  }
  return {
    options: parsed.values as any,
    args: parsed.positionals,
    printHelp,
  };

  function printHelp(autoExit?: boolean) {
    const binName = basename(process.argv[1]);
    let usage = `${binName} [OPTIONS]`;
    if (allowPositionals) usage += ` [ARGUMENTS]`;
    if (config.genUsage) usage = config.genUsage(config);

    const indent = config.indent || "";
    let helpText = [
      //
      "",
      indent + "Usage: " + usage,
      "",
      indent + "Options:",
      generateHelpTextForOptions({ ...(config.options || {}), ...extraOptions }, { indent: `${indent}  ` }),
      "",
    ];
    if (config.genHelp) helpText = config.genHelp(helpText, config);
    process.stdout.write(helpText.join("\n") + "\n");
    if (autoExit) process.exit(0);
    return;
  }
}

type ArgsSource = Record<string, string | boolean | string[] | boolean[] | undefined>;

/**
 * Extracts and converts an argument to integer(s) from parsed CLI arguments.
 * @param args - The parsed arguments object
 * @param argName - The name of the argument to extract
 * @param defaultInt - Default value to use if the argument is undefined
 * @returns A number or number array depending on the argument type
 */
export function getIntArg<Args extends ArgsSource, ArgName extends keyof Args & string>(
  args: Args,
  argName: ArgName,
  defaultInt: number
): Args[ArgName] extends string[] ? number[] : number {
  const val = args[argName];
  if (Array.isArray(val)) {
    const results: number[] = [];
    for (const v of val) {
      if (typeof v !== "string") throw new Error(`--${argName} is not a string`);
      const parsed = parseInt(v, 10);
      if (isNaN(parsed)) throw new Error(`Invalid integer value for --${String(argName)}: ${v}`);
      results.push(parsed);
    }
    return results as any;
  }
  if (typeof val === "boolean") throw new Error(`--${argName} is not a string`);
  if (val === undefined) return defaultInt as any;
  if (typeof val === "string") {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) throw new Error(`Invalid integer value for --${String(argName)}: ${val}`);
    return parsed as any;
  }
  return defaultInt as any;
}
