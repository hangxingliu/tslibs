/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

import { enableAnthropicCache } from "./transforms.js";
import type {
  ChatCompletionDeveloperMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionTool,
} from "openai/resources";
import type { ChatParams } from "./types.js";
import type { MessagesBuilder } from "./messages-builder.js";
import type { WellknownThinkingLevel } from "./model-metadata/types.js";
import { type ModelMetadata } from "./model-metadata/types.js";
import { openAIToolsToAnthropicAITools, openAIToolsToGoogleAITools } from "./tools.js";
import { FunctionCallingConfigMode } from "@google/genai";
import { estimateOpenAIMessageTokens } from "./estimate-tokens/openai.js";
import { calcThinkingBudget, setReasoningEffortForOpenAI, setThinkingLevelForGoogleAI } from "./thinking-level.js";

export type ChatParamsBuilderProvider = "google" | "openai" | "anthropic";

type ChatParamsBuilderCommonOpts = {
  seed?: number;
  temperature?: number;
  //
  systemPromptCache?: "5m" | "1h";
  thinking?: WellknownThinkingLevel;
  //
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  //
  maxOutputTokens?: (provider: ChatParamsBuilderProvider, estimatedInputTokens: number) => number | undefined | void;
};

function getMaxOutputTokens(
  fn: ChatParamsBuilderCommonOpts["maxOutputTokens"],
  provider: ChatParamsBuilderProvider,
  model: ModelMetadata,
  inputTokens: number
) {
  if (!fn) return;

  const count = fn(provider, inputTokens);
  if (!count || typeof count !== "number") return;
  if (model.maxOutputTokens) return Math.min(model.maxOutputTokens, count);
  return count;
}

function getSystemRoleForOpenAI(model: ModelMetadata): "developer" | "system" {
  // o1, o3, gpt-4.1, gpt-4o, gpt-5, ...
  if (model.name.match(/^(?:o\d+)(?:$|-)/)) return "developer";
  if (model.name.match(/^gpt-(?:[5-9]|4[\.o])/)) return "developer";
  return "system";
}

export class ChatParamsBuilder {
  readonly google: ChatParams.Google;
  readonly openai: ChatParams.OpenAI;
  readonly anthropic: ChatParams.Anthropic;

  readonly estimatedInputTokens: number;
  readonly estimatedOutputTokens: number;

  constructor(
    readonly model: ModelMetadata,
    readonly messages: MessagesBuilder,
    opts: ChatParamsBuilderCommonOpts = {}
  ) {
    const modelName = model.name.replace(/^models\//, "");
    const inputTokens = opts.estimatedInputTokens ?? estimateOpenAIMessageTokens(messages.openai);
    //
    this.estimatedInputTokens = inputTokens;
    this.estimatedOutputTokens = opts.estimatedOutputTokens || inputTokens * 1;

    this.google = {
      model: modelName,
      contents: messages.google,
      config: {
        systemInstruction: messages.system!,
        temperature: opts.temperature,
        seed: opts.seed,
        maxOutputTokens: getMaxOutputTokens(opts.maxOutputTokens, "google", model, inputTokens),
      },
    };

    this.anthropic = {
      model: modelName,
      system: [enableAnthropicCache(messages.system!, opts.systemPromptCache)],
      max_tokens: getMaxOutputTokens(opts.maxOutputTokens, "anthropic", model, inputTokens) || model.maxOutputTokens!,
      messages: messages.anthropic,
      temperature: opts.temperature,
    };

    const openAISystem: ChatCompletionDeveloperMessageParam | ChatCompletionSystemMessageParam = {
      role: getSystemRoleForOpenAI(model),
      content: messages.system!,
    };
    this.openai = {
      model: modelName,
      messages: [openAISystem, ...messages.openai],
      max_completion_tokens: getMaxOutputTokens(opts.maxOutputTokens, "openai", model, inputTokens),
      temperature: opts.temperature,
    };

    if (opts.thinking) this.setThinkingBudget(opts.thinking, true);
  }

  bindTools(this: ChatParamsBuilder, tools: Array<ChatCompletionTool>, mode?: "auto" | "required") {
    this.google.config!.tools = openAIToolsToGoogleAITools(tools);
    this.anthropic.tools = openAIToolsToAnthropicAITools(tools);
    this.openai.tools = tools;
    if (mode) {
      const isRequired = mode === "required";
      this.google.config!.toolConfig = {
        functionCallingConfig: {
          mode: isRequired ? FunctionCallingConfigMode.ANY : FunctionCallingConfigMode.AUTO,
        },
      };
      this.anthropic.tool_choice = { type: isRequired ? "any" : "auto" };
      this.openai.tool_choice = mode;
      // To avoid the error "invalid_request_error":
      // Thinking may not be enabled when tool_choice forces tool use.
      if (isRequired) delete this.anthropic.thinking;
    }
    return this;
  }

  setTemperature(temperature?: number | null) {
    if (typeof temperature !== "number") return;
    this.google.config!.temperature = temperature;
    this.openai.temperature = temperature;
    this.anthropic.temperature = temperature;
  }

  setMaxOutputTokens(tokens: number) {
    const max = this.model.maxOutputTokens;
    if (max && tokens > max) tokens = max;
    this.google.config!.maxOutputTokens = tokens;
    this.openai.max_completion_tokens = tokens;
    this.anthropic.max_tokens = tokens;
  }

  incrMaxOutputTokens(incrTokens: number) {
    const max = this.model.maxOutputTokens || Infinity;
    const { google, anthropic, openai } = this;
    if (google.config!.maxOutputTokens)
      google.config!.maxOutputTokens = Math.min(google.config!.maxOutputTokens + incrTokens, max);
    if (openai.max_completion_tokens)
      openai.max_completion_tokens = Math.min(openai.max_completion_tokens + incrTokens, max);
    anthropic.max_tokens = Math.min(anthropic.max_tokens + incrTokens, max);
  }

  setThinkingBudget(budget: WellknownThinkingLevel, incrMaxOutputToken?: boolean, maxOutputTokens?: number): number {
    const { model } = this;
    if (!model.thinking) return 0;
    setReasoningEffortForOpenAI(this.openai, this.model, budget);

    let budgetsResult: number | undefined;
    if (!setThinkingLevelForGoogleAI(this.google, this.model, budget)) {
      //
      const budgets = calcThinkingBudget(this.model, budget, true, this.estimatedOutputTokens, [
        this.google.config?.maxOutputTokens,
        maxOutputTokens,
      ]);
      if (!this.google.config?.thinkingConfig) this.google.config!.thinkingConfig = {};
      this.google.config!.thinkingConfig = { thinkingBudget: budgets };
      budgetsResult = budgets;
    }

    const budgets = calcThinkingBudget(this.model, budget, false, this.estimatedOutputTokens, [
      this.anthropic.max_tokens,
      maxOutputTokens,
    ]);
    if (typeof budgets === "number") {
      this.anthropic.thinking = budgets <= 0 ? { type: "disabled" } : { type: "enabled", budget_tokens: budgets };
      if (typeof budgetsResult !== "number" || budgetsResult <= 0) budgetsResult = budgets;
    }

    if (budgets && incrMaxOutputToken) this.incrMaxOutputTokens(budgets);
    return budgets || 0;
  }
}
