/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { FunctionCall, GenerateContentResponse } from "@google/genai";
import { getErrorMessage } from "@hangxingliu/common-utils";
import type { ToolsImplementation } from "./base.js";

export async function callToolsForGoogle(
  resp: GenerateContentResponse,
  tools: ToolsImplementation<Record<string, any>>,
  logger?: { log: (msg: string) => any; error: (msg: string) => any }
) {
  const errors: Error[] = [];
  let functionCalls: FunctionCall[] = [];
  if (resp.functionCalls) {
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
    const fn = tools[name] as (...args: any[]) => Promise<unknown>;
    if (!fn || typeof fn !== "function") {
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
