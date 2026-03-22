import { parseArgs } from "node:util";
import type { ParseArgsOptionsConfig } from "./parse-args.js";
import { generateHelpTextForOptions, parseCliArgs } from "./parse-args.js";

const options = {
  list: { type: "boolean", multiple: true, default: [false], help: "xxx?" },
  str: { type: "string" },
} satisfies ParseArgsOptionsConfig;

const { values: args } = parseArgs({
  options,
  args: ["--list", "--no-list", "x"],
  allowPositionals: true,
  allowNegative: true,
});

console.log(args);
console.log(generateHelpTextForOptions(options));

const cli = parseCliArgs({
  options: {
    test: { type: "string", help: "test value" },
    yes: { type: "boolean" },
    list: { type: "string", multiple: true },
  },
  version: "v1.0.0",
  args: process.argv.slice(2),
});
console.log(cli);
