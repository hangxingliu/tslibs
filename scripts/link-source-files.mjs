#!/usr/bin/env node
//@ts-check

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, relative, resolve } from "node:path";

/** @type {Record<string, Array<string|Array<string>>>} */
const tasks = {
  "packages/cli-utils/src/zero-deps": [
    "packages/common-utils/src/error.ts",
    "packages/common-utils/src/strings/shell-args-escape.ts",
    "packages/common-utils/src/strings/format-date.ts",
  ],
};

const baseDir = resolve(import.meta.dirname, "..");
const cwd = process.cwd();

for (const [targetDir, sources] of Object.entries(tasks)) {
  for (const source of sources) {
    /** @type {string} */
    let sourcePath;
    /** @type {string} */
    let targetName;
    if (Array.isArray(source)) {
      [sourcePath, targetName] = source;
    } else {
      sourcePath = source;
      targetName = basename(sourcePath);
    }
    sourcePath = resolve(baseDir, sourcePath);
    if (!existsSync(sourcePath)) throw new Error(`"${relative(cwd, sourcePath)}" does not exist`);

    const targetPath = resolve(targetDir, targetName);
    if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

    copyFileSync(sourcePath, targetPath);
    console.log(relative(cwd, targetPath));
  }
}
