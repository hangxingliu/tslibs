/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { OpenAI } from "openai";
import { getErrorMessage } from "@hangxingliu/common-utils";
import type { ToolsImplementation } from "./base.js";

/**
 * Executes all the tool/function calls in one OpenAI standard chat completion response.
 * The errors are collected instead of being thrown, so one failing tool doesn't skip the others.
 */
export async function callToolsForOpenAI(
  resp: OpenAI.ChatCompletion,
  tools: ToolsImplementation<Record<string, any>>,
  logger?: { log: (msg: string) => any; error: (msg: string) => any }
) {
  const errors: Error[] = [];
  const toolCalls = resp.choices[0]?.message?.tool_calls;

  if (!toolCalls || toolCalls.length === 0) {
    errors.push(new Error(`No function calls in the response(id=${resp.id} model=${resp.model})`));
    return returnResult();
  }

  const allToolCalls = toolCalls.filter((it) => it.type == "function");
  if (logger) logger.log(`calling ${allToolCalls.length} functions ...`);

  for (const toolCall of allToolCalls) {
    const call = toolCall.function;
    if (!call.name) {
      errors.push(new Error(`No function name of the call(id=${toolCall.id})`));
      continue;
    }
    const fn = tools[call.name] as (...args: any[]) => Promise<unknown>;
    if (!fn || typeof fn !== "function") {
      errors.push(new Error(`Unknown function name "${call.name}"`));
      continue;
    }

    try {
      await fn.apply(tools, [JSON.parse(call.arguments)]);
    } catch (error) {
      errors.push(error as Error);
    }
  }
  return returnResult();

  function returnResult() {
    if (logger && errors.length > 0) for (const error of errors) logger.error(`${getErrorMessage(error)}`);
    return { errors };
  }
}
