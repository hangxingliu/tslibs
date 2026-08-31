/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { Anthropic } from "@anthropic-ai/sdk";
import { getErrorMessage } from "@hangxingliu/common-utils";
import type { ToolsCallLogger, ToolsImplementation } from "./base.js";
import { resolveToolImplementation } from "./base.js";

/**
 * Executes all the tool/function calls in one Anthropic response.
 * The errors are collected instead of being thrown, so one failing tool doesn't skip the others.
 */
export async function callToolsForAnthropic(
  resp: Anthropic.Message,
  tools: ToolsImplementation<Record<string, any>>,
  logger?: ToolsCallLogger
) {
  const errors: Error[] = [];
  const functionCalls: Anthropic.ToolUseBlock[] = resp.content.filter((it) => it.type === "tool_use");

  if (functionCalls.length === 0) {
    errors.push(new Error(`No function calls in the response(id=${resp.id} model=${resp.model})`));
    return returnResult();
  }

  if (logger) logger.log(`calling ${functionCalls.length} functions ...`);

  for (const { id, name, input } of functionCalls) {
    if (!name) {
      errors.push(new Error(`No function name of the call(id=${id})`));
      continue;
    }
    const fn = resolveToolImplementation(tools, name);
    if (!fn) {
      errors.push(new Error(`Unknown function name "${name}"`));
      continue;
    }

    try {
      await fn.apply(tools, [input]);
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
