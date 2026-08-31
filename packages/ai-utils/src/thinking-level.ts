/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

import type { ModelMetadata, WellknownThinkingLevel } from "./model-metadata/types.js";
import type { ChatParams } from "./types.js";

/**
 * https://docs.claude.com/en/api/messages
 * Must be ≥1024 and less than max_tokens.
 * max_tokens: The maximum number of tokens to generate before stopping.
 */
const MIN_THINKING_BUDGET = 1024;
const DEFAULT_MAX_THINKING_BUDGET = 32768;

/**
 * Resolves the text value of the `reasoning_effort`/`thinkingLevel` parameter for the given model.
 *
 * @param dynamicFallback The level used to replace the `dynamic` level, because no provider accepts
 * `dynamic` as a valid text value of this parameter.
 * @returns `undefined` if the model doesn't accept this parameter. In that case, the caller should
 * fall back to the thinking budget (see {@link calcThinkingBudget}).
 */
function getThinkingLevel(
  model: ModelMetadata,
  level: WellknownThinkingLevel,
  dynamicFallback?: WellknownThinkingLevel
) {
  if (!model.thinking) return;
  if (!model.thinkingLevels) return; // this model doesn't support thinking levels
  if (model.thinking === "force") return;
  if (level === "off") return;

  const value = model.thinkingLevels?.[level];
  if (value) return value;
  if (level === "dynamic" && dynamicFallback) return model.thinkingLevels[dynamicFallback] || dynamicFallback;
  return level;
}

export function setReasoningEffortForOpenAI(payload: any, model: ModelMetadata, level: WellknownThinkingLevel) {
  const value = getThinkingLevel(model, level, "low");
  if (!value) return;

  const prop = model.thinkingLevelProps || "reasoning_effort";
  const parts = prop.split(".");

  let target = payload;
  for (let i = 0; i < parts.length - 1; i++) {
    if (target[parts[i]] == null) target[parts[i]] = {};
    target = target[parts[i]];
  }
  target[parts[parts.length - 1]] = value;
  return value;
}

type MinGoogleCharParamsPayload = {
  config?: Pick<Required<ChatParams.Google>["config"], "thinkingConfig">;
};

/**
 * Sets `config.thinkingConfig.thinkingLevel` in a Google AI payload.
 * @returns The value written into the payload, or `undefined` if nothing was changed
 */
export function setThinkingLevelForGoogleAI(
  payload: MinGoogleCharParamsPayload,
  model: ModelMetadata,
  level: WellknownThinkingLevel
) {
  const value = getThinkingLevel(model, level, "high");
  if (!value) return;

  if (!payload.config) payload.config = {};
  if (!payload.config.thinkingConfig) payload.config.thinkingConfig = {};
  payload.config.thinkingConfig.thinkingLevel = value as any;
  return value;
}

export function calcThinkingBudget(
  model: ModelMetadata,
  level: WellknownThinkingLevel,
  allowDynamic: boolean,
  estimatedOutputTokens: number,
  maxOutputTokens?: number | Array<number | null | undefined>
) {
  if (!model.thinking) return;
  let hardLimit: { min: number; max: number };
  if (model.thinkingBudgets) {
    hardLimit = {
      min: model.thinkingBudgets[0],
      max: model.thinkingBudgets[1],
    };
  } else {
    hardLimit = {
      min: MIN_THINKING_BUDGET,
      max: DEFAULT_MAX_THINKING_BUDGET,
    };
    if (typeof maxOutputTokens === "number") {
      hardLimit.max = maxOutputTokens;
    } else {
      hardLimit.max = DEFAULT_MAX_THINKING_BUDGET;
      if (Array.isArray(maxOutputTokens)) {
        for (const val of maxOutputTokens)
          if (typeof val === "number" && val > 0 && val < hardLimit.max) hardLimit.max = val;
      }
    }
  }

  let tokens: number;
  switch (level) {
    case "off":
      if (model.thinking === "force") return hardLimit.min;
      return 0;
    case "minimal":
      return hardLimit.min;
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

  if (tokens < hardLimit.min) tokens = hardLimit.min;
  if (tokens >= hardLimit.max) tokens = hardLimit.max - 1;
  return Math.floor(tokens);
}
