/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { FunctionCall, GenerateContentResponse } from "@google/genai";
import { getErrorMessage } from "@hangxingliu/common-utils";
import type { ToolsCallLogger, ToolsImplementation } from "./base.js";
import { resolveToolImplementation } from "./base.js";

/**
 * Executes all the tool/function calls in one Google AI response.
 * The errors are collected instead of being thrown, so one failing tool doesn't skip the others.
 */
export async function callToolsForGoogle(
  resp: GenerateContentResponse,
  tools: ToolsImplementation<Record<string, any>>,
  logger?: ToolsCallLogger
) {
  const errors: Error[] = [];
  let functionCalls: FunctionCall[] = [];
  // `resp.functionCalls` is a shortcut getter, and it can return an empty array when the response
  // contains function calls in the candidates that it doesn't recognize. So the candidates are
  // still scanned in that case.
  if (resp.functionCalls?.length) {
    functionCalls = resp.functionCalls;
  } else if (resp.candidates) {
    for (const candidate of resp.candidates) {
      const parts = candidate.content?.parts;
      if (!parts) continue;
      for (const part of parts) if (part.functionCall) functionCalls.push(part.functionCall);
    }
  }

  if (functionCalls.length === 0) {
    errors.push(new Error(`No function calls in the response(id=${resp.responseId} model=${resp.modelVersion})`));
    return returnResult();
  }

  if (logger) logger.log(`calling ${functionCalls.length} functions ...`);

  for (const { id, name, args } of functionCalls) {
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
      await fn.apply(tools, [args]);
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
