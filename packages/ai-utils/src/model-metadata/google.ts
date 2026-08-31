/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { KnownModelProvider, type ModelMetadata } from "./types.js";

/**
 * https://ai.google.dev/gemini-api/docs/thinking#thinking-levels
 *
 * - Thinking Levels: Gemini 3
 * - Thinking budgets: Gemini 2
 */
const GEMINI_3_THINKING_LEVELS = {
  minimal: "minimal",
  low: "low",
  medium: "medium",
  high: "high",
  max: "high",
} satisfies ModelMetadata["thinkingLevels"];

const GEMINI_3_THINKING_LEVELS_WITHOUT_MINIMAL = {
  ...GEMINI_3_THINKING_LEVELS,
  minimal: "low",
} satisfies ModelMetadata["thinkingLevels"];

/**
 * - https://ai.google.dev/gemini-api/docs/models
 * - https://ai.google.dev/gemini-api/docs/pricing
 *
 * The prices of `gemini-3.7-flash` and `gemini-3.6-flash` listed below are the promotional prices
 * that are valid through December 31, 2026. They will be doubled starting January 1, 2027.
 */
export const GOOGLE_GEMINI_MODELS = [
  // Gemini 3.7
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-3.7-flash",
    prefixes: ["gemini-3.7-flash"],
    //
    cost1MInputTokens: 0.75,
    cost1MOutputTokens: 3.75,
    cost1MCachedTokens: 0.075,
    cost1MCachedTokensWrite: 0,
    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinking: true,
    thinkingLevels: GEMINI_3_THINKING_LEVELS_WITHOUT_MINIMAL,
  },
  // Gemini 3.6
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-3.6-flash",
    prefixes: ["gemini-3.6-flash"],
    //
    cost1MInputTokens: 0.75,
    cost1MOutputTokens: 3.75,
    cost1MCachedTokens: 0.075,
    cost1MCachedTokensWrite: 0,
    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinking: true,
    thinkingLevels: GEMINI_3_THINKING_LEVELS,
  },
  // Gemini 3.5
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-3.5-flash-lite",
    prefixes: ["gemini-3.5-flash-lite"],
    //
    cost1MInputTokens: 0.3,
    cost1MOutputTokens: 2.5,
    cost1MCachedTokens: 0.03,
    cost1MCachedTokensWrite: 0,
    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinking: true,
    thinkingLevels: GEMINI_3_THINKING_LEVELS,
  },
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-3.5-flash",
    prefixes: ["gemini-3.5-flash"],
    //
    cost1MInputTokens: 1.5,
    cost1MOutputTokens: 9,
    cost1MCachedTokens: 0.15,
    cost1MCachedTokensWrite: 0,
    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinking: true,
    thinkingLevels: GEMINI_3_THINKING_LEVELS,
  },
  // Gemini 3.1
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-3.1-pro-preview",
    prefixes: ["gemini-3.1-pro"],
    //
    cost1MInputTokens: [
      { gt: 200_000, price: 4 },
      { gt: 0, price: 2 },
    ],
    cost1MOutputTokens: [
      { gt: 200_000, price: 18 },
      { gt: 0, price: 12 },
    ],
    cost1MCachedTokens: [
      { gt: 200_000, price: 0.4 },
      { gt: 0, price: 0.2 },
    ],
    cost1MCachedTokensWrite: 0,
    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinking: true,
    thinkingLevels: GEMINI_3_THINKING_LEVELS_WITHOUT_MINIMAL,
  },
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-3.1-flash-lite",
    prefixes: ["gemini-3.1-flash-lite", "gemini-3.1-flash"],
    //
    cost1MInputTokens: 0.25,
    cost1MOutputTokens: 1.5,
    cost1MCachedTokens: 0.025,
    cost1MCachedTokensWrite: 0,
    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinking: true,
    thinkingLevels: GEMINI_3_THINKING_LEVELS,
  },
  // Gemini 3
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-3-flash-preview",
    prefixes: ["gemini-3-flash"],
    //
    cost1MInputTokens: 0.5,
    cost1MOutputTokens: 3,
    cost1MCachedTokens: 0.05,
    cost1MCachedTokensWrite: 0,
    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinking: true,
    thinkingLevels: GEMINI_3_THINKING_LEVELS,
  },
] as const satisfies ModelMetadata[];
