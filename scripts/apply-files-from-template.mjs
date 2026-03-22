#!/usr/bin/env node
//@ts-check

import { basename, dirname, relative, resolve } from "path";
import { globSync } from "glob";
import { copyFileSync } from "fs";

const projectDir = resolve(import.meta.dirname, "..");
const files = [
  resolve(projectDir, "packages/template/tsconfig.cjs.json"),
  resolve(projectDir, "packages/template/tsconfig.json"),
  resolve(projectDir, "packages/template/eslint.config.mjs"),
  resolve(projectDir, "packages/template/.gitignore"),
];

const pkgDirs = globSync("packages/*/package.json", { cwd: projectDir, absolute: true })
  .map((it) => dirname(it))
  .filter((it) => basename(it) !== "template");
console.log(`found ${pkgDirs.length} packages`);

const cwd = process.cwd();

for (const pkgDir of pkgDirs) {
  for (const filePath of files) {
    const srcRelPath = relative(cwd, filePath);
    const targetPath = resolve(pkgDir, basename(filePath));
    const targetRelPath = relative(cwd, targetPath);
    console.log(`cp '${srcRelPath}' '${targetRelPath}'`);
    copyFileSync(filePath, targetPath);
  }
}
