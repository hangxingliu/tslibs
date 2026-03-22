//@ts-check
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";

const scopesFile = resolve(import.meta.dirname, ".commitlintrc.scopes");

/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  ignores: [(commit) => commit.toLowerCase().startsWith("wip")],
  /**
   * `[0]` represents disabling the rule
   * @see https://github.com/conventional-changelog/commitlint/blob/master/docs/reference/rules.md
   */
  rules: {
    // Sentence case
    "subject-case": [2, "always", ["sentence-case"]],
    "header-max-length": [0],
    "footer-max-length": [0],
    "body-max-line-length": [0],
    "type-enum": [
      2,
      "always",
      [
        //
        "wip",
        "revert",
        "deps",
        "release",
        "docs",
        "test",
        "style",
        "feat",
        "fix",
        "perf",
        "refactor",
        "chore",
      ],
    ],
  },
};
try {
  if (existsSync(scopesFile)) {
    const lines = readFileSync(scopesFile, "utf-8").split(/[\r\n]+/);
    const scopes = lines.map((it) => it.replace(/#.*$/, "").trim()).filter(Boolean);
    //@ts-ignore
    config.rules["scope-enum"] = [2, "always", scopes];
  }
} catch (error) {
  console.warn(error);
}
export default config;
