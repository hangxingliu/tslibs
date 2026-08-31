/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { KnownModelProvider, type ModelMetadata } from "./types.js";
import { ANTHROPIC_EFFORT_LEVELS, ANTHROPIC_EFFORT_PROP } from "./anthropic-common.js";

/**
 * - https://docs.anthropic.com/en/docs/about-claude/models/overview
 * - https://platform.claude.com/docs/en/build-with-claude/prompt-caching#pricing
 */
export const ANTHROPIC_MODELS = [
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-fable-5",
    prefixes: ["claude-fable-5"],
    //
    cost1MInputTokens: 10,
    cost1MOutputTokens: 50,
    cost1MCachedTokens: 1,
    cost1MCachedTokensWrite: { shortLife: 12.5, longLife: 20 },
    maxInputTokens: 1_000_000,
    maxOutputTokens: 128_000,
    thinking: true,
    thinkingLevels: ANTHROPIC_EFFORT_LEVELS,
    thinkingLevelProps: ANTHROPIC_EFFORT_PROP,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-opus-5",
    prefixes: ["claude-opus-5"],
    //
    cost1MInputTokens: 5,
    cost1MOutputTokens: 25,
    cost1MCachedTokens: 0.5,
    cost1MCachedTokensWrite: { shortLife: 6.25, longLife: 10 },
    maxInputTokens: 1_000_000,
    maxOutputTokens: 128_000,
    thinking: true,
    thinkingLevels: ANTHROPIC_EFFORT_LEVELS,
    thinkingLevelProps: ANTHROPIC_EFFORT_PROP,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-sonnet-5",
    prefixes: ["claude-sonnet-5"],
    //
    cost1MInputTokens: 2,
    cost1MOutputTokens: 10,
    cost1MCachedTokens: 0.2,
    cost1MCachedTokensWrite: { shortLife: 2.5, longLife: 4 },
    maxInputTokens: 1_000_000,
    maxOutputTokens: 128_000,
    thinking: true,
    thinkingLevels: ANTHROPIC_EFFORT_LEVELS,
    thinkingLevelProps: ANTHROPIC_EFFORT_PROP,
  },
  //
  //
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-opus-4-8",
    prefixes: ["claude-opus-4-8"],
    //
    cost1MInputTokens: 5,
    cost1MOutputTokens: 25,
    cost1MCachedTokens: 0.5,
    cost1MCachedTokensWrite: { shortLife: 6.25, longLife: 10 },
    maxInputTokens: 1_000_000,
    maxOutputTokens: 128_000,
    thinking: true,
    thinkingLevels: ANTHROPIC_EFFORT_LEVELS,
    thinkingLevelProps: ANTHROPIC_EFFORT_PROP,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-opus-4-7",
    prefixes: ["claude-opus-4-7", "claude-opus-4-6"],
    //
    cost1MInputTokens: 5,
    cost1MOutputTokens: 25,
    cost1MCachedTokens: 0.5,
    cost1MCachedTokensWrite: { shortLife: 6.25, longLife: 10 },
    maxInputTokens: 1_000_000,
    maxOutputTokens: 128_000,
    thinking: true,
    thinkingLevels: ANTHROPIC_EFFORT_LEVELS,
    thinkingLevelProps: ANTHROPIC_EFFORT_PROP,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-sonnet-4-6",
    prefixes: ["claude-sonnet-4-6"],
    //
    cost1MInputTokens: 3,
    cost1MOutputTokens: 15,
    cost1MCachedTokens: 0.3,
    cost1MCachedTokensWrite: { shortLife: 3.75, longLife: 6 },
    maxInputTokens: 1_000_000,
    maxOutputTokens: 64_000,
    thinking: true,
    thinkingLevels: ANTHROPIC_EFFORT_LEVELS,
    thinkingLevelProps: ANTHROPIC_EFFORT_PROP,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-haiku-4-5-20251001",
    prefixes: ["claude-haiku-4-5"],
    //
    cost1MInputTokens: 1,
    cost1MOutputTokens: 5,
    cost1MCachedTokens: 0.1,
    cost1MCachedTokensWrite: { shortLife: 1.25, longLife: 2 },
    maxInputTokens: 200_000,
    maxOutputTokens: 64_000,
    /** Only the extended thinking mode is available, the `effort` parameter is not supported */
    thinking: true,
  },
] as const satisfies ModelMetadata[];
