//@ts-check
import getAllESLintConfigs from "../../scripts/eslint-configs.mjs";
export default [{ ignores: ["src/references/**"] }, ...getAllESLintConfigs(import.meta.dirname)];
