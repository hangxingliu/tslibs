/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { ReadonlyDeep } from "type-fest";
import type { OpenAI } from "openai";
import type { GenerateContentResponseUsageMetadata } from "@google/genai";
import type { Usage as AnthropicUsage } from "@anthropic-ai/sdk/resources/messages";
import type { ModelMetadata } from "./model-metadata/types.js";
import { calcTokenCost } from "./model-metadata/utils.js";

/**
 * A provider-independent representation of the token usage of one request.
 *
 * All the fields follow the same convention:
 *
 * - {@link totalInputTokens} contains {@link cachedInputTokens} (the cache hits), but it doesn't
 *   contain the cache creation tokens, because they are billed by a different price.
 * - {@link outputTokens} contains the reasoning/thinking tokens.
 */
export class Usage {
  /** All the input (prompt) tokens, including {@link cachedInputTokens} */
  totalInputTokens = 0;
  /** The part of {@link totalInputTokens} that hit the prompt cache */
  cachedInputTokens = 0;
  /** All the output tokens, including the reasoning/thinking tokens */
  outputTokens = 0;

  /** The tokens written into the short-life (5 minutes for Anthropic) prompt cache */
  cacheCreationTokens = 0;
  /** The tokens written into the long-life (1 hour for Anthropic) prompt cache */
  longLifeCacheCreationTokens = 0;

  /** Calculates the cost (in USD) of this usage on the given model */
  static getCost(usage: ReadonlyDeep<Usage>, model: ReadonlyDeep<ModelMetadata>) {
    const { totalInputTokens, cachedInputTokens, outputTokens, cacheCreationTokens, longLifeCacheCreationTokens } =
      usage;
    return calcTokenCost(model, totalInputTokens, outputTokens, cachedInputTokens, {
      shortLife: cacheCreationTokens,
      longLife: longLifeCacheCreationTokens,
    });
  }

  /**
   * `promptTokenCount` of Google AI already contains `cachedContentTokenCount`,
   * but it doesn't contain `toolUsePromptTokenCount`.
   * @see https://ai.google.dev/api/generate-content#UsageMetadata
   */
  static fromGoogle(usageMetadata: ReadonlyDeep<GenerateContentResponseUsageMetadata>) {
    const usage = new Usage();
    usage.totalInputTokens = (usageMetadata.promptTokenCount || 0) + (usageMetadata.toolUsePromptTokenCount || 0);
    usage.cachedInputTokens = usageMetadata.cachedContentTokenCount || 0;

    // `candidatesTokenCount` doesn't contain the thinking tokens, and both of them can be absent
    // in the responses of some models. So the total token count is used as the fallback here.
    const candidates = usageMetadata.candidatesTokenCount;
    const thoughts = usageMetadata.thoughtsTokenCount;
    if (typeof candidates === "number" || typeof thoughts === "number") {
      usage.outputTokens = (candidates || 0) + (thoughts || 0);
    } else {
      usage.outputTokens = Math.max(0, (usageMetadata.totalTokenCount || 0) - usage.totalInputTokens);
    }
    return usage;
  }

  /**
   * Unlike the other providers, the `input_tokens` of Anthropic contains **neither** the cache read
   * tokens **nor** the cache creation tokens. They must be summed up manually.
   * @see https://platform.claude.com/docs/en/build-with-claude/prompt-caching
   */
  static fromAnthropic(
    usageMetadata: ReadonlyDeep<
      Pick<
        AnthropicUsage,
        "input_tokens" | "cache_read_input_tokens" | "output_tokens" | "cache_creation" | "cache_creation_input_tokens"
      >
    >
  ) {
    const usage = new Usage();
    usage.cachedInputTokens = usageMetadata.cache_read_input_tokens || 0;
    usage.totalInputTokens = (usageMetadata.input_tokens || 0) + usage.cachedInputTokens;
    usage.outputTokens = usageMetadata.output_tokens || 0;
    if (usageMetadata.cache_creation) {
      const { ephemeral_5m_input_tokens, ephemeral_1h_input_tokens } = usageMetadata.cache_creation;
      usage.cacheCreationTokens = ephemeral_5m_input_tokens || 0;
      usage.longLifeCacheCreationTokens = ephemeral_1h_input_tokens || 0;
    } else {
      usage.cacheCreationTokens = usageMetadata.cache_creation_input_tokens || 0;
    }
    return usage;
  }

  /**
   * `prompt_tokens` of the OpenAI standard already contains `prompt_tokens_details.cached_tokens`.
   * @see https://platform.openai.com/docs/api-reference/chat/object
   */
  static fromOpenAI(
    usageMetadata: ReadonlyDeep<
      Pick<OpenAI.CompletionUsage, "completion_tokens" | "prompt_tokens" | "prompt_tokens_details">
    >
  ) {
    const usage = new Usage();
    usage.totalInputTokens = usageMetadata.prompt_tokens || 0;
    usage.cachedInputTokens = usageMetadata.prompt_tokens_details?.cached_tokens || 0;
    usage.outputTokens = usageMetadata.completion_tokens || 0;
    return usage;
  }
}
