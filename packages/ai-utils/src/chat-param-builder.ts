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
  ReasoningEffort,
} from "openai/resources";
import type { ChatParams } from "./types.js";
import type { MessagesBuilder } from "./messages-builder.js";
import { KnownModelProvider, type ModelMetadata } from "./model-metadata/types.js";
import { openAIToolsToAnthropicAITools, openAIToolsToGoogleAITools } from "./tools.js";
import { FunctionCallingConfigMode } from "@google/genai";
import { estimateOpenAIMessageTokens } from "./estimate-tokens/openai.js";

type Provider = "google" | "openai" | "anthropic";
type ChatParamsBuilderCommonOpts = {
  seed?: number;
  temperature?: number;
  systemPromptCache?: "5m" | "1h";
  thinking?: ThinkingBudget;
  estimatedInputTokens?: number;
  maxOutputTokens?: (provider: Provider, estimatedInputTokens: number) => number | undefined | void;
};

function getMaxOutputTokens(
  fn: ChatParamsBuilderCommonOpts["maxOutputTokens"],
  provider: Provider,
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

export type ThinkingBudget = "dynamic" | "off" | "minimal" | "low" | "medium" | "high" | "max";

export class ChatParamsBuilder {
  readonly google: ChatParams.Google;
  readonly openai: ChatParams.OpenAI;
  readonly anthropic: ChatParams.Anthropic;

  readonly estimatedInputTokens: number;

  constructor(
    readonly model: ModelMetadata,
    readonly messages: MessagesBuilder,
    readonly opts: ChatParamsBuilderCommonOpts = {}
  ) {
    const modelName = model.name.replace(/^models\//, "");
    const inputTokens = opts.estimatedInputTokens ?? estimateOpenAIMessageTokens(messages.openai);
    this.estimatedInputTokens = inputTokens;

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

  private getOpenAIReasoningEffort(budget: ThinkingBudget): ReasoningEffort | undefined {
    if (!this.model.thinking) return;
    if (this.model.provider === KnownModelProvider.XAI) {
      // reasoning_effort is not supported by grok-4.
      // Specifying reasoning_effort parameter will get an error response.
      if (this.model.thinking === "force") return;
      switch (budget) {
        case "minimal":
        case "low":
        case "medium":
          return "low";
        case "high":
        case "max":
          return "high";
        default:
          return;
      }
    }
    switch (budget) {
      case "max":
        return "high";
      case "minimal":
      case "low":
      case "medium":
      case "high":
        return budget;
      default:
        return;
    }
  }

  setThinkingBudget(budget: ThinkingBudget, incrMaxOutputToken?: boolean, maxOutputTokens?: number): number {
    const { model } = this;
    if (!model.thinking) return 0;
    this.openai.reasoning_effort = this.getOpenAIReasoningEffort(budget);
    // this.anthropic.thinking = { type: "enabled", budget_tokens: 1024 };

    let min: number, max: number;
    if (model.thinkingBudgets) {
      min = model.thinkingBudgets[0];
      max = model.thinkingBudgets[1];
    } else {
      // https://docs.claude.com/en/api/messages
      // Must be ≥1024 and less than max_tokens.
      // max_tokens: The maximum number of tokens to generate before stopping.
      min = 1024;
      max = this.anthropic.max_tokens;
      //
      let _max = this.openai.max_completion_tokens;
      if (_max && _max < max) max = _max;
      //
      _max = this.google.config?.maxOutputTokens;
      if (_max && _max < max) max = _max;
    }
    if (typeof maxOutputTokens === "number" && max > maxOutputTokens) max = maxOutputTokens;

    let tokens = this.estimatedInputTokens;
    switch (budget) {
      case "off":
        this.google.config!.thinkingConfig = {
          thinkingBudget: model.thinking === "force" ? min : 0,
        };
        this.anthropic.thinking = { type: "disabled" };
        return 0;
      case "dynamic":
        this.google.config!.thinkingConfig = { thinkingBudget: -1 };
        return 0;
      case "max":
        this.google.config!.thinkingConfig = { thinkingBudget: max };
        this.anthropic.thinking = { type: "enabled", budget_tokens: max };
        if (incrMaxOutputToken) this.incrMaxOutputTokens(max);
        return max;
      case "minimal":
        this.google.config!.thinkingConfig = { thinkingBudget: min };
        this.anthropic.thinking = { type: "enabled", budget_tokens: min };
        if (incrMaxOutputToken) this.incrMaxOutputTokens(min);
        return min;
      case "medium":
        tokens *= 2;
        break;
      case "high":
        tokens *= 4;
        break;
    }

    if (tokens < min) tokens = min;
    if (tokens > max) tokens = max;
    this.google.config!.thinkingConfig = { thinkingBudget: tokens };
    this.anthropic.thinking = { type: "enabled", budget_tokens: tokens };
    if (incrMaxOutputToken) this.incrMaxOutputTokens(tokens);
    return tokens;
  }
}
