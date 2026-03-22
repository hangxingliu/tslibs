#!/usr/bin/env node
//@ts-check

import { resolve } from "node:path";
import { rimraf } from "rimraf";

const patterns = [
  "packages/*/cjs",
  "packages/*/esm",
  "packages/*/*.tsbuildinfo",
  "packages/*/.dts",

  // vite(bundling tools) cache
  "**/node_modules/.vite",
  "**/node_modules/.cache",
];

process.chdir(resolve(import.meta.dirname, ".."));
console.log(`$ chdir '${process.cwd()}'`);

console.log(`$ rimraf ${patterns.join(" ")}`);
rimraf(patterns, { glob: true });
