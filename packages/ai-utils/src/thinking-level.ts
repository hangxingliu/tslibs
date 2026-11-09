/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

import type { ModelMetadata, WellknownThinkingLevel } from "@hangxingliu/ai-model-metadata";
import type { ChatParams } from "./types.js";

/**
 * Resolves the text value of the `reasoning_effort`/`thinkingLevel` parameter for the given model.
 *
 * @param dynamicFallback The level used to replace the `dynamic` level, because no provider accepts
 * `dynamic` as a valid text value of this parameter.
 * @returns `undefined` if the model doesn't accept this parameter. In that case, the caller should
 * fall back to the thinking budget (see `calcThinkingBudget` from `@hangxingliu/ai-model-metadata`).
 */
function getThinkingLevel(
  model: ModelMetadata,
  level: WellknownThinkingLevel,
  dynamicFallback?: WellknownThinkingLevel
) {
  if (!model.thinking) return;
  if (!model.thinkingLevels) return; // this model doesn't support thinking levels
  if (model.thinking === "force") return; // this model doesn't accept any thinking parameter
  // `off` is sent only when the model can disable reasoning (for example xAI `none`).
  if (level === "off") return model.thinkingLevels.off;

  if (level === "dynamic") {
    if (!dynamicFallback || dynamicFallback === "dynamic") return;
    return model.thinkingLevels[dynamicFallback] || dynamicFallback;
  }
  return model.thinkingLevels[level];
}

/**
 * Sets the reasoning effort in an OpenAI standard chat completion payload.
 * @returns The value written into the payload, or `undefined` if nothing was changed
 */
export function setReasoningEffortForOpenAI(payload: any, model: ModelMetadata, level: WellknownThinkingLevel) {
  const value = getThinkingLevel(model, level, "low");
  if (!value) return;

  // The property can be a nested path. E.g., `reasoning.effort`
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
