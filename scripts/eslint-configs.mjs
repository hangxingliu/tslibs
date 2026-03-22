//@ts-check
/** @typedef {import('eslint').Linter.Config<any>} ESLintConfig */
import globals from "globals";

import jsRules from "@eslint/js";

import tsRules from "typescript-eslint";

import prettierRules from "eslint-plugin-prettier/recommended";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as overriding from "./eslint-rules.mjs";

/**
 * Default pattern: `["**\/node_modules/", ".git/"]`
 * @see https://eslint.org/docs/latest/use/configure/ignore
 */
export const wellKnownIgnores = ["**/cjs/**", "**/esm/**", "**/dist/**", "**/third_party/**", "**/*.cts"];

export const jsGlobals = {
  ...globals.node,
  ...globals.commonjs,
  ...globals.browser,
  ...globals.es2021,
  ...globals.mocha,
  // run-browser-tests: done(error?: Error)
  done: "readonly",
};

/** @type {any} */
let prettierCache;
/**
 * @param {string} subModuleDir
 * @returns {any}
 */
export function getPrettierRC(subModuleDir) {
  if (prettierCache && prettierCache.key === subModuleDir) return prettierCache.val;
  const prettierFileAtRoot = resolve(import.meta.dirname, "../.prettierrc");
  let prettierFile = prettierFileAtRoot;
  if (subModuleDir) {
    const prettierFileInSubModule = resolve(subModuleDir, ".prettierrc");
    if (existsSync(prettierFileInSubModule)) prettierFile = prettierFileInSubModule;
  }
  const rc = JSON.parse(readFileSync(prettierFile, "utf-8"));
  prettierCache = { key: subModuleDir, val: rc };
  return rc;
}

/**
 * ESLint config for TypeScript files
 *
 * @param {string} dirname
 * @returns {ESLintConfig[]}
 */
export function getESLintConfigForTypeScript(dirname) {
  const rules = {
    "prettier/prettier": ["warn", getPrettierRC(dirname)],
    ...overriding.tsRules,
  };
  //@ts-ignore
  return tsRules.config({
    files: ["{src,lib,test,tests}/**/*.{ts,mts,cts}"],
    ignores: wellKnownIgnores,
    rules: /** @type {any} */ (rules),
    languageOptions: {
      globals: /** @type {any} */ (jsGlobals),
      parserOptions: {
        tsconfigRootDir: dirname,
        projectService: {
          loadTypeScriptPlugins: !!process.env.VSCODE_PID,
        },
      },
    },
    //
    extends: [jsRules.configs.recommended, ...tsRules.configs.recommended, prettierRules],
  });
}

/**
 * ESLint config for JavaScript files
 *
 * @param {string} dirname
 * @returns {ESLintConfig[]}
 */
export function getESLintConfigForJavaScript(dirname) {
  return [
    {
      ...prettierRules,
      files: ["{src,lib,scripts,patches}/**/*.{js,mjs,cjs}", "eslint.*.mjs"],
      ignores: wellKnownIgnores,
      languageOptions: {
        ecmaVersion: 2022,
        globals: /** @type {any} */ (jsGlobals),
      },
      rules: {
        "prettier/prettier": ["warn", getPrettierRC(dirname)],
        ...jsRules.configs.recommended.rules,
        ...prettierRules.rules,
        ...overriding.jsRules,
      },
    },
  ];
}

/**
 * @param {string} dirname
 */
export default function getAllESLintConfigs(dirname) {
  return [...getESLintConfigForJavaScript(dirname), ...getESLintConfigForTypeScript(dirname)];
}
