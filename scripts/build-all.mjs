#!/usr/bin/env node
//@ts-check
///
/// Build all sub-modules quickly for debugging purpose
///
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectDir = resolve(import.meta.dirname, "..");
const dim = "\x1b[2m";
const reset = "\x1b[0m";

const cmdBase = [
  "swc-mux",
  // -D, --copy-files -s, --source-maps
  ...["--strip-leading-paths", "--no-swcrc", "-D", "-s"],
  ...["--config", "jsc.parser.syntax=typescript"],
  ...["--config", "jsc.target=es2022"],
  ...["--config", `module.ignoreDynamic=true`],
];
execSync(
  [
    ...cmdBase,
    ...muxProject("packages/cli-utils", "es6", "src", "esm"),
    ...muxProject("packages/cli-utils", "commonjs", "src", "cjs"),
    ...muxProject("packages/common-utils", "es6", "src", "esm"),
    ...muxProject("packages/common-utils", "commonjs", "src", "cjs"),
    ...process.argv.slice(2),
  ],
  projectDir
);

/**
 * @param {string} moduleDir
 * @param {string} moduleType
 * @param {string} srcDir
 * @param {string} outDir
 */
function muxProject(moduleDir, moduleType, srcDir, outDir) {
  return ["--mux", "--config", `module.type=${moduleType}`, `${moduleDir}/${srcDir}`, "-d", `${moduleDir}/${outDir}`];
}

/**
 * @param {string[]} command
 * @param {string} cwd
 */
function execSync(command, cwd) {
  console.log(`${dim}$ ${command.join(" ")}${reset}`);
  const [bin, ...args] = command;
  const env = { ...process.env };
  const path = (process.env.PATH || "").split(":");
  path.unshift(resolve(projectDir, "node_modules/.bin"));
  env.PATH = path.filter(Boolean).join(":");

  const isWin32 = process.platform === "win32";
  const ret = spawnSync(bin, args, {
    cwd,
    env,
    shell: isWin32 ? true : undefined,
    stdio: ["inherit", "inherit", "inherit"],
  });
  if (ret.status !== 0) {
    let log = `${bin} exit with`;
    if (typeof ret.status === "number") log += ` code ${ret.status}`;
    if (ret.signal) log += ` signal ${ret.signal}`;
    if (ret.error) log += ` error "${ret.error.message}"`;
    console.error(log);
    process.exit(typeof ret.status === "number" ? ret.status : 1);
  }
}
