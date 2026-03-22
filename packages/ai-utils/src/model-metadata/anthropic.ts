/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { KnownModelProvider, type ModelMetadata } from "./types.js";

/**
 * https://docs.anthropic.com/en/docs/about-claude/models/overview
 */
export const ANTHROPIC_MODELS = [
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-opus-4-5-20251101",
    prefixes: ["claude-opus-4-5"],
    //
    cost1MInputTokens: 5,
    cost1MOutputTokens: 25,
    cost1MCachedTokens: 1.5,
    cost1MCachedTokensWrite: { shortLife: 18.75, longLife: 30 },
    maxOutputTokens: 64_000,
    thinking: true,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-sonnet-4-5-20250929",
    prefixes: ["claude-sonnet-4-5"],
    //
    cost1MInputTokens: 3,
    cost1MOutputTokens: 15,
    cost1MCachedTokens: 0.3,
    cost1MCachedTokensWrite: { shortLife: 3.75, longLife: 6 },
    maxOutputTokens: 64_000,
    thinking: true,
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
    maxOutputTokens: 64_000,
    thinking: true,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-opus-4-1-20250805",
    prefixes: ["claude-opus-4-1"],
    //
    cost1MInputTokens: 15,
    cost1MOutputTokens: 75,
    cost1MCachedTokens: 1.5,
    cost1MCachedTokensWrite: { shortLife: 18.75, longLife: 30 },
    maxOutputTokens: 32_000,
    thinking: true,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-opus-4-20250514",
    prefixes: ["claude-opus-4-0"],
    //
    cost1MInputTokens: 15,
    cost1MOutputTokens: 75,
    cost1MCachedTokens: 1.5,
    cost1MCachedTokensWrite: { shortLife: 18.75, longLife: 30 },
    maxOutputTokens: 32_000,
    thinking: true,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-sonnet-4-20250514",
    prefixes: ["claude-sonnet-4-0"],
    //
    cost1MInputTokens: 3,
    cost1MOutputTokens: 15,
    cost1MCachedTokens: 0.3,
    cost1MCachedTokensWrite: { shortLife: 3.75, longLife: 6 },
    maxOutputTokens: 64_000,
    thinking: true,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-3-7-sonnet-20250219",
    prefixes: ["claude-3-7-sonnet"],
    //
    cost1MInputTokens: 3,
    cost1MOutputTokens: 15,
    cost1MCachedTokens: 0.3,
    cost1MCachedTokensWrite: { shortLife: 3.75, longLife: 6 },
    maxOutputTokens: 64_000,
    thinking: true,
  },
  {
    provider: KnownModelProvider.ANTHROPIC,
    name: "claude-3-5-haiku-20241022",
    prefixes: ["claude-3-5-haiku"],
    //
    cost1MInputTokens: 0.8,
    cost1MOutputTokens: 4,
    cost1MCachedTokens: 0.08,
    cost1MCachedTokensWrite: { shortLife: 1, longLife: 1.6 },
    maxOutputTokens: 8192,
    thinking: true,
  },
] as const satisfies ModelMetadata[];
