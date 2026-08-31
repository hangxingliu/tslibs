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

/**
 * `max_tokens` is a required field of the Anthropic API, but some models don't declare their max
 * output tokens. This value is used as the last resort in that case.
 */
const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

type ChatParamsBuilderCommonOpts = {
  seed?: number;
  temperature?: number;
  /** Enables the Anthropic prompt cache on the system prompt with the given TTL */
  systemPromptCache?: "5m" | "1h";
  thinking?: WellknownThinkingLevel;
  //
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  //
  maxOutputTokens?: (provider: ChatParamsBuilderProvider, estimatedInputTokens: number) => number | undefined | void;
};

/** Resolves the max output tokens for one provider, and it never exceeds the model's hard limit */
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
  if (model.name.match(/^gpt-(?:\d{2,}|[5-9])(?:$|[-.])/)) return "developer";
  if (model.name.match(/^gpt-4[.o]/)) return "developer";
  return "system";
}

/**
 * Builds the chat completion payloads of the three mainstream API standards (Google AI, Anthropic
 * and OpenAI) from the same messages, so the caller can switch the provider without rebuilding
 * the request.
 */
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
    this.estimatedOutputTokens = opts.estimatedOutputTokens || inputTokens;

    this.google = {
      model: modelName,
      contents: messages.google,
      config: {
        systemInstruction: messages.system,
        temperature: opts.temperature,
        seed: opts.seed,
        maxOutputTokens: getMaxOutputTokens(opts.maxOutputTokens, "google", model, inputTokens),
      },
    };

    this.anthropic = {
      model: modelName,
      max_tokens:
        getMaxOutputTokens(opts.maxOutputTokens, "anthropic", model, inputTokens) ||
        model.maxOutputTokens ||
        DEFAULT_MAX_OUTPUT_TOKENS,
      messages: messages.anthropic,
      temperature: opts.temperature,
    };
    // The Anthropic API rejects an empty `system` array, so this field is set only when it is needed
    if (messages.system) this.anthropic.system = [enableAnthropicCache(messages.system, opts.systemPromptCache)];

    this.openai = {
      model: modelName,
      messages: [...messages.openai],
      max_completion_tokens: getMaxOutputTokens(opts.maxOutputTokens, "openai", model, inputTokens),
      temperature: opts.temperature,
    };
    if (messages.system) {
      const openAISystem: ChatCompletionDeveloperMessageParam | ChatCompletionSystemMessageParam = {
        role: getSystemRoleForOpenAI(model),
        content: messages.system,
      };
      this.openai.messages.unshift(openAISystem);
    }

    if (opts.thinking) this.setThinkingBudget(opts.thinking, true);
  }

  /**
   * Binds the tools (declared in the OpenAI standard) into all the payloads.
   * @param mode `auto` lets the model decide, `required` forces the model to call at least one tool
   */
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
    if (typeof temperature !== "number") return this;
    this.google.config!.temperature = temperature;
    this.openai.temperature = temperature;
    this.anthropic.temperature = temperature;
    return this;
  }

  setMaxOutputTokens(tokens: number) {
    const max = this.model.maxOutputTokens;
    if (max && tokens > max) tokens = max;
    this.google.config!.maxOutputTokens = tokens;
    this.openai.max_completion_tokens = tokens;
    this.anthropic.max_tokens = tokens;
    return this;
  }

  /**
   * Increases the max output tokens of all the payloads by `incrTokens`.
   * It is used for reserving extra room for the thinking tokens.
   */
  incrMaxOutputTokens(incrTokens: number) {
    const max = this.model.maxOutputTokens || Infinity;
    const { google, anthropic, openai } = this;
    if (google.config!.maxOutputTokens)
      google.config!.maxOutputTokens = Math.min(google.config!.maxOutputTokens + incrTokens, max);
    if (openai.max_completion_tokens)
      openai.max_completion_tokens = Math.min(openai.max_completion_tokens + incrTokens, max);
    if (typeof anthropic.max_tokens === "number")
      anthropic.max_tokens = Math.min(anthropic.max_tokens + incrTokens, max);
    return this;
  }

  /**
   * Applies the thinking configuration on all the payloads:
   *
   * - OpenAI standard: `reasoning_effort` (or the property declared by the model metadata)
   * - Google AI: `thinkingLevel` for Gemini 3+, and `thinkingBudget` for the older models
   * - Anthropic: `effort` (handled by the OpenAI standard branch) and the extended thinking budget
   *
   * @param incrMaxOutputToken Whether the max output tokens should be increased by the resolved
   * budget, so the thinking tokens don't eat up the room of the final answer
   * @returns The resolved thinking budget in tokens (`0` means "no numeric budget is used")
   */
  setThinkingBudget(budget: WellknownThinkingLevel, incrMaxOutputToken?: boolean, maxOutputTokens?: number): number {
    const { model } = this;
    if (!model.thinking) return 0;
    setReasoningEffortForOpenAI(this.openai, this.model, budget);

    let googleBudget: number | undefined;
    // The models supporting `thinkingLevel` (Gemini 3+) don't accept `thinkingBudget`
    if (!setThinkingLevelForGoogleAI(this.google, this.model, budget)) {
      googleBudget = calcThinkingBudget(this.model, budget, true, this.estimatedOutputTokens, [
        this.google.config?.maxOutputTokens,
        maxOutputTokens,
      ]);
      if (typeof googleBudget === "number") {
        if (!this.google.config) this.google.config = {};
        this.google.config.thinkingConfig = { ...this.google.config.thinkingConfig, thinkingBudget: googleBudget };
      }
    }

    // The dynamic budget (-1) is not supported by Anthropic, so `allowDynamic` is `false` here
    const anthropicBudget = calcThinkingBudget(this.model, budget, false, this.estimatedOutputTokens, [
      this.anthropic.max_tokens,
      maxOutputTokens,
    ]);
    if (typeof anthropicBudget === "number")
      this.anthropic.thinking =
        anthropicBudget <= 0 ? { type: "disabled" } : { type: "enabled", budget_tokens: anthropicBudget };

    if (anthropicBudget && anthropicBudget > 0 && incrMaxOutputToken) this.incrMaxOutputTokens(anthropicBudget);

    // Prefers the budget that is an actual token count over the dynamic budget (-1)
    if (anthropicBudget && anthropicBudget > 0) return anthropicBudget;
    if (googleBudget && googleBudget > 0) return googleBudget;
    return googleBudget || anthropicBudget || 0;
  }
}
