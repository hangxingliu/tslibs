/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

import type { FunctionDeclaration } from "@google/genai";
import type { Tools } from "./types.js";

export function openAIToolsToGoogleAITools(tools: Tools.OpenAI[]): Tools.Google[] {
  const functions: FunctionDeclaration[] = [];
  for (const tool of tools) {
    if (tool.type !== "function" || !tool.function) continue;
    const func = structuredClone(tool.function);
    delete func.strict;
    functions.push(func as any as FunctionDeclaration);
  }
  if (functions.length === 0) return [];
  return [{ functionDeclarations: functions }];
}

export function openAIToolsToAnthropicAITools(tools: Tools.OpenAI[]): Tools.Anthropic[] {
  const functions: Tools.Anthropic[] = [];
  for (const tool of tools) {
    if (tool.type !== "function" || !tool.function) continue;
    const { name, description, parameters } = tool.function;

    let input_schema: Tools.Anthropic["input_schema"];
    if (parameters) input_schema = structuredClone(parameters) as any;
    else input_schema = { type: "object" };

    functions.push({ type: "custom", name, description, input_schema });
  }
  return functions;
}
