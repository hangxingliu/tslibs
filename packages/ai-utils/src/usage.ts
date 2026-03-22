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

export class Usage {
  declare totalInputTokens: number;
  declare cachedInputTokens: number;
  declare outputTokens: number;

  declare cacheCreationTokens: number;
  declare longLifeCacheCreationTokens: number;

  static getCost(usage: ReadonlyDeep<Usage>, model: ReadonlyDeep<ModelMetadata>) {
    const { totalInputTokens, cachedInputTokens, outputTokens, cacheCreationTokens, longLifeCacheCreationTokens } =
      usage;
    return calcTokenCost(model, totalInputTokens, outputTokens, cachedInputTokens, {
      shortLife: cacheCreationTokens,
      longLife: longLifeCacheCreationTokens,
    });
  }

  static fromGoogle(usageMetadata: ReadonlyDeep<GenerateContentResponseUsageMetadata>) {
    const usage = new Usage();
    usage.totalInputTokens = usageMetadata.promptTokenCount || 0;
    usage.cachedInputTokens = usageMetadata.cachedContentTokenCount || 0;
    usage.outputTokens = Math.max(0, (usageMetadata.totalTokenCount || 0) - usage.totalInputTokens);
    usage.cacheCreationTokens = 0;
    usage.longLifeCacheCreationTokens = 0;
    return usage;
  }

  static fromAnthropic(
    usageMetadata: ReadonlyDeep<
      Pick<
        AnthropicUsage,
        "input_tokens" | "cache_read_input_tokens" | "output_tokens" | "cache_creation" | "cache_creation_input_tokens"
      >
    >
  ) {
    const usage = new Usage();
    usage.totalInputTokens = usageMetadata.input_tokens;
    usage.cachedInputTokens = usageMetadata.cache_read_input_tokens || 0;
    usage.outputTokens = usageMetadata.output_tokens;
    if (usageMetadata.cache_creation) {
      const { ephemeral_5m_input_tokens, ephemeral_1h_input_tokens } = usageMetadata.cache_creation;
      usage.cacheCreationTokens = ephemeral_5m_input_tokens;
      usage.longLifeCacheCreationTokens = ephemeral_1h_input_tokens;
    } else {
      usage.cacheCreationTokens = usageMetadata.cache_creation_input_tokens || 0;
      usage.longLifeCacheCreationTokens = 0;
    }
    return usage;
  }

  static fromOpenAI(
    usageMetadata: ReadonlyDeep<
      Pick<OpenAI.CompletionUsage, "completion_tokens" | "prompt_tokens" | "prompt_tokens_details">
    >
  ) {
    const usage = new Usage();
    usage.totalInputTokens = usageMetadata.prompt_tokens;
    usage.cachedInputTokens = usageMetadata.prompt_tokens_details?.cached_tokens || 0;
    usage.outputTokens = usageMetadata.completion_tokens;
    usage.cacheCreationTokens = 0;
    usage.longLifeCacheCreationTokens = 0;
    return usage;
  }
}
