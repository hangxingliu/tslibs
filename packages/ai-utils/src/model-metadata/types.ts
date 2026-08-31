/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
type TokenPriceRule = {
  /**
   * The exclusive lower bound of this tier. This rule takes effect when the token count of the
   * request is **greater than** this value.
   * (E.g., `gt: 200_000` means "the requests using more than 200K tokens")
   */
  gt: number;
  /** The price (in USD) per 1M tokens */
  price: number;
};

/** A fixed price per 1M tokens, or a tiered price table (see {@link TokenPriceRule}) */
export type ModelTokenPrice = number | ReadonlyArray<Readonly<TokenPriceRule>>;

/**
 * Anthropic charges different prices for writing into the caches with different TTLs.
 * @see https://platform.claude.com/docs/en/build-with-claude/prompt-caching#pricing
 */
export type AnthropicCacheWritePrice = {
  /** The price (per 1M tokens) of writing into the 5-minute cache */
  shortLife: number;
  /** The price (per 1M tokens) of writing into the 1-hour cache */
  longLife: number;
};

export enum KnownModelProvider {
  XAI = "xai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
}

export type WellknownThinkingLevel = "dynamic" | "off" | "minimal" | "low" | "medium" | "high" | "max";

export type ModelMetadata = {
  provider: string;
  name: Lowercase<string>;
  prefixes: ReadonlyArray<Lowercase<string>>;
  //
  cost1MInputTokens: ModelTokenPrice;
  cost1MOutputTokens: ModelTokenPrice;
  cost1MCachedTokens?: ModelTokenPrice;
  cost1MCachedTokensWrite?: ModelTokenPrice | Readonly<AnthropicCacheWritePrice>;
  //
  maxOutputTokens?: number;
  maxInputTokens?: number;
  //
  /**
   * Google Thinking budgets
   * @see https://ai.google.dev/gemini-api/docs/thinking#set-budget
   * @see https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking
   */
  thinkingBudgets?: Readonly<[min: number, max: number]>;
  /**
   * Mapping from {@link WellknownThinkingLevel} enumeration type to the text value for `reasoning_effort`/`thinkingLevel`.
   *
   * - OpenAI spec: `reasoning_effort`
   * - Google: `thinkingLevel`
   */
  thinkingLevels?: { [x in WellknownThinkingLevel]?: string };
  thinkingLevelProps?: string;
  /**
   * The behavior of "force" here is as follows:
   *
   * - For the OpenAI standard, it indicates that although the model supports reasoning, it does not support parameter configuration.
   * - For Google AI, it indicates that the model must include a minimum thinking budget.
   */
  thinking?: boolean | "force";
};
