/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { KnownModelProvider, type ModelMetadata } from "./types.js";

export const LEGACY_GROK_THINKING_LEVELS = {
  minimal: "low",
  low: "low",
  medium: "low",
  high: "high",
  max: "high",
} satisfies ModelMetadata["thinkingLevels"];

/**
 * https://docs.x.ai/docs/models
 */
export const XAI_MODELS = [
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4.20-multi-agent-latest",
    prefixes: ["grok-4.20-multi-agent"],
    //
    cost1MInputTokens: 2,
    cost1MOutputTokens: 6,
    cost1MCachedTokens: 0.2,
    cost1MCachedTokensWrite: 0,
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
    cost1MInputTokens: 2,
    cost1MOutputTokens: 6,
    cost1MCachedTokens: 0.2,
    cost1MCachedTokensWrite: 0,
    thinking: false,
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4.20-reasoning-latest",
    prefixes: ["grok-4.20-reasoning", "grok-4.20"],
    //
    cost1MInputTokens: 2,
    cost1MOutputTokens: 6,
    cost1MCachedTokens: 0.2,
    cost1MCachedTokensWrite: 0,
    thinking: "force",
  },
  //
  //
  //
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4-1-fast-non-reasoning",
    prefixes: ["grok-4-fast-non-reasoning", "grok-4-1-fast-non-reasoning"],
    //
    cost1MInputTokens: 0.2,
    cost1MOutputTokens: 0.5,
    cost1MCachedTokens: 0.05,
    cost1MCachedTokensWrite: 0,
    thinking: false,
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4-1-fast-reasoning",
    prefixes: ["grok-4-fast-reasoning", "grok-4-fast", "grok-4-1-fast-reasoning", "grok-4-1-fast"],
    //
    cost1MInputTokens: 0.2,
    cost1MOutputTokens: 0.5,
    cost1MCachedTokens: 0.05,
    cost1MCachedTokensWrite: 0,
    thinking: "force",
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-code-fast-1",
    prefixes: ["grok-code-fast"],
    //
    cost1MInputTokens: 0.2,
    cost1MOutputTokens: 1.5,
    cost1MCachedTokens: 0.02,
    cost1MCachedTokensWrite: 0,
    thinking: true,
    thinkingLevels: LEGACY_GROK_THINKING_LEVELS,
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-4-0709",
    prefixes: ["grok-4"],
    //
    cost1MInputTokens: 3,
    cost1MOutputTokens: 15,
    cost1MCachedTokens: 0.75,
    cost1MCachedTokensWrite: 0,
    thinking: "force",
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-3",
    prefixes: ["grok-3"],
    //
    cost1MInputTokens: 3,
    cost1MOutputTokens: 15,
    cost1MCachedTokens: 0.75,
    cost1MCachedTokensWrite: 0,
    thinking: true,
    thinkingLevels: LEGACY_GROK_THINKING_LEVELS,
  },
  {
    provider: KnownModelProvider.XAI,
    name: "grok-3-mini",
    prefixes: ["grok-3-mini"],
    //
    cost1MInputTokens: 0.3,
    cost1MOutputTokens: 0.5,
    cost1MCachedTokens: 0.075,
    cost1MCachedTokensWrite: 0,
    thinking: "force",
  },
] as const satisfies ModelMetadata[];
