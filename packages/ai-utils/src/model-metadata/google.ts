/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { KnownModelProvider, type ModelMetadata } from "./types.js";

/**
 * - https://ai.google.dev/gemini-api/docs/models
 * - https://ai.google.dev/gemini-api/docs/pricing
 * - https://ai.google.dev/gemini-api/docs/thinking#set-budget
 */
export const GOOGLE_GEMINI_MODELS = [
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-3-pro-preview",
    prefixes: ["gemini-3-pro"],
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
  },
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
  },
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-2.5-pro",
    prefixes: ["gemini-2.5-pro"],
    //
    cost1MInputTokens: [
      { gt: 200_000, price: 2.5 },
      { gt: 0, price: 1.25 },
    ],
    cost1MOutputTokens: [
      { gt: 200_000, price: 15 },
      { gt: 0, price: 10 },
    ],
    cost1MCachedTokens: [
      { gt: 200_000, price: 0.25 },
      { gt: 0, price: 0.125 },
    ],
    cost1MCachedTokensWrite: 0,
    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinkingBudgets: [128, 32768],
    thinking: "force",
  },
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-2.5-flash",
    prefixes: ["gemini-2.5-flash"],
    //
    cost1MInputTokens: 0.3,
    cost1MOutputTokens: 2.5,
    cost1MCachedTokens: 0.03,
    cost1MCachedTokensWrite: 0,

    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinkingBudgets: [0, 24576],
    thinking: true,
  },
  {
    provider: KnownModelProvider.GOOGLE,
    name: "gemini-2.5-flash-lite",
    prefixes: ["gemini-2.5-flash-lite"],
    //
    cost1MInputTokens: 0.1,
    cost1MOutputTokens: 0.4,
    cost1MCachedTokens: 0.03,
    cost1MCachedTokensWrite: 0,

    maxOutputTokens: 65_536,
    maxInputTokens: 1_048_576,
    //
    thinkingBudgets: [512, 24576],
    thinking: true,
  },
] as const satisfies ModelMetadata[];
