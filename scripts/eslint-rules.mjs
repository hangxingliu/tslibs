//@ts-check
/** @typedef {import('eslint').Linter.Config<any>} ESLintConfig */
/**
 * ESLint rules for overriding (TypeScript files)
 * @type {ESLintConfig['rules']}
 */
export const tsRules = {
  //
  /** @todo [temporary] */
  "no-var": "off",
  /** @todo [temporary] */
  "prefer-const": [
    "warn",
    {
      destructuring: "any",
      ignoreReadBeforeAssign: false,
    },
  ],
  "no-useless-catch": "warn",
  "no-useless-escape": "off",
  /** `!!val` => `boolean` */
  "no-extra-boolean-cast": "off",
  /** if(true) {...} */
  "no-constant-condition": "warn",
  //
  /** @todo [temporary] we should change to (...args) => any */
  /** `self = this` */
  "@typescript-eslint/no-this-alias": "off",
  "@typescript-eslint/no-unsafe-function-type": "warn",
  "@typescript-eslint/no-unused-expressions": "warn",
  "@typescript-eslint/ban-ts-comment": "off",
  "@typescript-eslint/no-empty-object-type": "off",
  "@typescript-eslint/no-require-imports": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-namespace": "off",
  "@typescript-eslint/no-unused-vars": [
    "warn",
    {
      args: "none",
      varsIgnorePattern: "debug|_",
    },
  ],
  "@typescript-eslint/consistent-type-imports": "warn",
  /**
   * Enforce that class methods utilize this.
   * If they don't need to use `this`, these member functions can be separated out as utility functions.
   */
  // "class-methods-use-this": "error",
};

/**
 * ESLint rules for overriding (Svelte files)
 * @type {ESLintConfig['rules']}
 */
export const svelteRules = {
  ...tsRules,
  /** Due to svelte syntax `$: ....` */
  "@typescript-eslint/no-unused-expressions": "off",
};

/**
 * ESLint rules for overriding (JavaScript files)
 * @type {ESLintConfig['rules']}
 */
export const jsRules = {
  ...tsRules,
  "no-unused-vars": "off",
};
for (const key of Object.keys(jsRules))
  if (key.startsWith("@typescript-eslint")) delete jsRules[key];
