/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
type TokenPriceRule = {
  /** min tokens */
  gt: number;
  /** per 1M token */
  price: number;
};

export type ModelTokenPrice = number | ReadonlyArray<Readonly<TokenPriceRule>>;

export type AnthropicCacheWritePrice = {
  shortLife: number;
  longLife: number;
};

export enum KnownModelProvider {
  XAI = "xai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
}

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
  thinking: boolean | "force";
};
