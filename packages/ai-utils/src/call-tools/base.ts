/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { ReadonlyDeep } from "type-fest";
import type { JSONSchema, TypeFromJSONSchema } from "@hangxingliu/common-utils";

export type ToolsImplementation<T extends Record<string, ReadonlyDeep<JSONSchema>>> = {
  [key in keyof T]: (args: TypeFromJSONSchema<T[key]>) => Promise<any>;
};

/** The logger accepted by all the `callToolsForXXX` functions */
export type ToolsCallLogger = {
  log: (msg: string) => any;
  error: (msg: string) => any;
};

/** Function names that must never be resolved as a tool implementation */
const UNSAFE_TOOL_NAMES: ReadonlySet<string> = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Resolves the implementation of the function `name` safely.
 *
 * Both the own properties of `tools` and the methods defined by its own class(es) are accepted,
 * so a `tools` object created by `new ToolsImpl()` works as expected.
 * But a malicious/hallucinated function name (E.g., `constructor`, `toString`) can't reach
 * anything on the built-in prototypes (`Object.prototype` and `Function.prototype`).
 */
export function resolveToolImplementation(
  tools: ToolsImplementation<Record<string, any>>,
  name: string
): ((...args: any[]) => Promise<unknown>) | undefined {
  if (!tools || typeof name !== "string" || UNSAFE_TOOL_NAMES.has(name)) return;

  let holder: object | null = tools;
  while (holder && holder !== Object.prototype && holder !== Function.prototype) {
    if (Object.prototype.hasOwnProperty.call(holder, name)) {
      const fn = (tools as Record<string, unknown>)[name];
      return typeof fn === "function" ? (fn as (...args: any[]) => Promise<unknown>) : undefined;
    }
    holder = Object.getPrototypeOf(holder);
  }
  return;
}
