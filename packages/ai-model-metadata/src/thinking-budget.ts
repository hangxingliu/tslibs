/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

import type { ModelMetadata, WellknownThinkingLevel } from "./types.js";

/**
 * https://docs.claude.com/en/api/messages
 * Must be ≥1024 and less than max_tokens.
 * max_tokens: The maximum number of tokens to generate before stopping.
 */
const MIN_THINKING_BUDGET = 1024;
const DEFAULT_MAX_THINKING_BUDGET = 32768;

/**
 * Resolves the smallest positive number in `maxOutputTokens`.
 * The thinking budget must be less than the max output tokens of the request.
 */
function getMaxOutputTokensLimit(maxOutputTokens?: number | Array<number | null | undefined>): number | undefined {
  if (typeof maxOutputTokens === "number") return maxOutputTokens > 0 ? maxOutputTokens : undefined;
  if (!Array.isArray(maxOutputTokens)) return;

  let limit: number | undefined;
  for (const val of maxOutputTokens)
    if (typeof val === "number" && val > 0 && (limit === undefined || val < limit)) limit = val;
  return limit;
}

/**
 * Calculates the thinking budget (in tokens) for the models accepting a numeric budget
 * (Anthropic extended thinking and Gemini 2 thinking budgets).
 *
 * @param allowDynamic Whether the provider accepts `-1` as the "let the model decide" budget.
 * (It is supported by Google AI only)
 * @param estimatedOutputTokens The estimated output tokens of this request. The budget is a ratio of it.
 * @param maxOutputTokens The max output tokens of this request. It can be an array, then the
 * smallest positive value in it is used.
 * @returns `undefined` if the model doesn't support thinking, `-1` for the dynamic budget,
 * or a non-negative token count
 */
export function calcThinkingBudget(
  model: ModelMetadata,
  level: WellknownThinkingLevel,
  allowDynamic: boolean,
  estimatedOutputTokens: number,
  maxOutputTokens?: number | Array<number | null | undefined>
) {
  if (!model.thinking) return;

  const hardLimit = {
    min: model.thinkingBudgets ? model.thinkingBudgets[0] : MIN_THINKING_BUDGET,
    max: model.thinkingBudgets ? model.thinkingBudgets[1] : DEFAULT_MAX_THINKING_BUDGET,
  };

  // The budget must always be less than the max output tokens of the request,
  // no matter whether the model declares its own budget range or not.
  const limit = getMaxOutputTokensLimit(maxOutputTokens);
  if (limit !== undefined && limit - 1 < hardLimit.max) hardLimit.max = limit - 1;
  if (hardLimit.max < hardLimit.min) hardLimit.max = hardLimit.min;

  let tokens: number;
  switch (level) {
    case "off":
      // Thinking can't be disabled on these models, so the minimum budget is used instead
      if (model.thinking === "force") return clamp(hardLimit.min);
      return 0;
    case "minimal":
      return clamp(hardLimit.min);
    case "dynamic":
      if (allowDynamic) return -1;
      tokens = estimatedOutputTokens * 0.75;
      break;
    //
    case "max":
      tokens = estimatedOutputTokens;
      break;
    case "medium":
      tokens = estimatedOutputTokens * 0.5;
      break;
    case "high":
      tokens = estimatedOutputTokens * 0.75;
      break;
    case "low":
    default:
      tokens = estimatedOutputTokens * 0.25;
      break;
  }
  return Math.floor(clamp(tokens));

  function clamp(value: number) {
    if (value < hardLimit.min) return hardLimit.min;
    if (value > hardLimit.max) return hardLimit.max;
    return value;
  }
}
