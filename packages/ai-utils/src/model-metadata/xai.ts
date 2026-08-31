/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { KnownModelProvider, type ModelMetadata } from "./types.js";

/**
 * The prompt token threshold of the xAI long context pricing.
 * A request whose prompt reaches this threshold is billed at the higher rate for all tokens in the request.
 */
const LONG_CONTEXT_THRESHOLD = 200_000;

function createTokenPrice(normal: number, longContext: number) {
  return [
    { gt: LONG_CONTEXT_THRESHOLD, price: longContext },
    { gt: 0, price: normal },
  ] as const satisfies ModelMetadata["cost1MInputTokens"];
}

/**
 * `grok-4.6` and newer models support `low`, `medium`, `high` (default) and `xhigh`.
 * Reasoning cannot be disabled on these models.
 * @see https://docs.x.ai/developers/model-capabilities/text/reasoning
 */
const GROK_THINKING_LEVELS_WITH_XHIGH = {
  minimal: "low",
  low: "low",
  medium: "medium",
  high: "high",
  max: "xhigh",
} satisfies ModelMetadata["thinkingLevels"];

/** `xhigh` is not available on these models, and it is treated as `high` by xAI */
const GROK_THINKING_LEVELS = {
  ...GROK_THINKING_LEVELS_WITH_XHIGH,
  max: "high",
} satisfies ModelMetadata["thinkingLevels"];

/**
 * https://docs.x.ai/developers/pricing
 * https://docs.x.ai/developers/models
 */
export const XAI_MODELS = [
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4.6",
    prefixes: ["grok-4.6"],
    //
    cost1MInputTokens: createTokenPrice(2, 4),
    cost1MOutputTokens: createTokenPrice(6, 12),
    cost1MCachedTokens: createTokenPrice(0.5, 1),
    cost1MCachedTokensWrite: 0,
    maxInputTokens: 500_000,
    //
    thinking: true,
    thinkingLevels: GROK_THINKING_LEVELS_WITH_XHIGH,
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4.5",
    prefixes: ["grok-4.5"],
    //
    cost1MInputTokens: createTokenPrice(2, 4),
    cost1MOutputTokens: createTokenPrice(6, 12),
    cost1MCachedTokens: createTokenPrice(0.3, 0.6),
    cost1MCachedTokensWrite: 0,
    maxInputTokens: 500_000,
    //
    thinking: true,
    thinkingLevels: GROK_THINKING_LEVELS,
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4.3",
    prefixes: ["grok-4.3"],
    //
    cost1MInputTokens: createTokenPrice(1.25, 2.5),
    cost1MOutputTokens: createTokenPrice(2.5, 5),
    cost1MCachedTokens: createTokenPrice(0.2, 0.4),
    cost1MCachedTokensWrite: 0,
    maxInputTokens: 1_000_000,
    //
    thinking: true,
    thinkingLevels: GROK_THINKING_LEVELS,
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-build-0.1",
    prefixes: ["grok-build"],
    //
    cost1MInputTokens: createTokenPrice(1, 2),
    cost1MOutputTokens: createTokenPrice(2, 4),
    cost1MCachedTokens: createTokenPrice(0.2, 0.4),
    cost1MCachedTokensWrite: 0,
    maxInputTokens: 256_000,
    //
    thinking: "force",
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4.20-multi-agent-latest",
    prefixes: ["grok-4.20-multi-agent"],
    //
    cost1MInputTokens: createTokenPrice(1.25, 2.5),
    cost1MOutputTokens: createTokenPrice(2.5, 5),
    cost1MCachedTokens: createTokenPrice(0.2, 0.4),
    cost1MCachedTokensWrite: 0,
    maxInputTokens: 1_000_000,
    thinking: true,
    thinkingLevels: {
      minimal: "low",
      low: "low",
      medium: "medium",
      high: "high",
      max: "xhigh",
    },
    thinkingLevelProps: "reasoning.effort",
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4.20-non-reasoning-latest",
    prefixes: ["grok-4.20-non-reasoning", "grok-4.20-0309-non-reasoning"],
    //
    cost1MInputTokens: createTokenPrice(1.25, 2.5),
    cost1MOutputTokens: createTokenPrice(2.5, 5),
    cost1MCachedTokens: createTokenPrice(0.2, 0.4),
    cost1MCachedTokensWrite: 0,
    maxInputTokens: 1_000_000,
    thinking: false,
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4.20-reasoning-latest",
    prefixes: ["grok-4.20-reasoning", "grok-4.20"],
    //
    cost1MInputTokens: createTokenPrice(1.25, 2.5),
    cost1MOutputTokens: createTokenPrice(2.5, 5),
    cost1MCachedTokens: createTokenPrice(0.2, 0.4),
    cost1MCachedTokensWrite: 0,
    maxInputTokens: 1_000_000,
    thinking: "force",
  },
] as const satisfies ModelMetadata[];
