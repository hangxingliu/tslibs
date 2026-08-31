/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { ReadonlyDeep } from "type-fest";
import type { AnthropicCacheWritePrice, ModelMetadata, ModelTokenPrice } from "./types.js";

const ONE_MILLION_TOKENS = 1_000_000;

/**
 * Resolves the model metadata items matching the given model name.
 *
 * The matching strategy is:
 *
 * 1. An exact match on {@link ModelMetadata.name} always wins, and it is returned alone.
 * 2. Otherwise, all items owning a prefix of `modelName` are returned in the same order as they
 *    appear in `metadata`. Therefore the first element of the result is the matched item owning the
 *    smallest index. `metadata` is expected to be ordered from the newest model to the oldest one,
 *    so this keeps the newest matched model first instead of the one owning the longest prefix.
 *
 * @param modelName Case-insensitive model name. The Google AI style `models/` scope is stripped.
 */
export function filterModelMetadata<Metadata extends ModelMetadata = ModelMetadata>(
  modelName: string,
  metadata: ReadonlyArray<ReadonlyDeep<Metadata>>
): Array<ReadonlyDeep<Metadata>> {
  modelName = modelName.toLowerCase().replace(/^models\//, "") as Lowercase<string>;
  const matched: Array<ReadonlyDeep<Metadata>> = [];
  for (const item of metadata) {
    if (item.name === modelName) return [item];
    if (item.prefixes.some((prefix) => modelName.startsWith(prefix))) matched.push(item);
  }
  return matched;
}

/**
 * Calculates the cost of `tokens` for one kind of token (input/output/cached/...).
 *
 * A {@link ModelTokenPrice} can be a tiered price table. Each rule takes effect when the token count
 * is **greater than** its `gt` field. This function picks the rule owning the largest matched `gt`,
 * so the rules don't need to be sorted in a particular order.
 *
 * @param tierTokens The token count deciding which tier is used. Both Google AI and xAI decide it
 * by the size of the whole prompt instead of the counted tokens themselves.
 * (E.g., the output tokens of a request are billed at the long context price once its prompt
 * exceeds the threshold, no matter how many tokens are generated)
 */
function _calcTokenCost(tokens: number, price: ModelTokenPrice, tierTokens: number = tokens) {
  if (tokens <= 0) return 0;
  if (typeof price === "number") return (tokens * price) / ONE_MILLION_TOKENS;

  let matched: (typeof price)[0] | undefined;
  let fallback: (typeof price)[0] | undefined;
  for (const rule of price) {
    if (tierTokens > rule.gt) {
      if (!matched || rule.gt > matched.gt) matched = rule;
    } else if (!fallback || rule.gt < fallback.gt) {
      // The smallest tier is used when the token count doesn't reach any tier threshold
      fallback = rule;
    }
  }
  const rule = matched || fallback;
  if (!rule) return 0;
  return (tokens * rule.price) / ONE_MILLION_TOKENS;
}

/**
 * Calculates the cache write (cache creation) cost.
 * Anthropic charges different prices for the 5-minute (`shortLife`) and 1-hour (`longLife`) caches,
 * while the other providers use a single price for both of them.
 */
function _calcCacheWriteCost(
  shortLife: number,
  longLife: number,
  price: ModelTokenPrice | Readonly<AnthropicCacheWritePrice>,
  tierTokens: number
) {
  let cost = 0;
  const isAnthropicPrice = typeof price === "object" && !Array.isArray(price) && "shortLife" in price;
  if (shortLife > 0)
    cost += _calcTokenCost(shortLife, isAnthropicPrice ? price.shortLife : (price as ModelTokenPrice), tierTokens);
  if (longLife > 0)
    cost += _calcTokenCost(longLife, isAnthropicPrice ? price.longLife : (price as ModelTokenPrice), tierTokens);
  return cost;
}

/**
 * Calculates the total cost (in USD) of one request.
 *
 * @param totalInputTokens All the input tokens of this request, **including** `cachedInputTokens`,
 * but **excluding** `createdCacheTokens` (they are billed by the cache write price instead)
 * @param cachedInputTokens The part of `totalInputTokens` that hit the prompt cache
 * @param createdCacheTokens The tokens written into the prompt cache
 */
export function calcTokenCost(
  metadata: ReadonlyDeep<ModelMetadata>,
  totalInputTokens: number,
  outputTokens: number,
  cachedInputTokens: number = 0,
  createdCacheTokens: number | { shortLife: number; longLife: number } = 0
): number {
  const { cost1MInputTokens, cost1MOutputTokens, cost1MCachedTokens, cost1MCachedTokensWrite } = metadata;

  const cacheWriteTokens =
    typeof createdCacheTokens === "number"
      ? { shortLife: createdCacheTokens, longLife: 0 }
      : createdCacheTokens || { shortLife: 0, longLife: 0 };
  // The tiered prices are decided by the size of the whole prompt, and all the kinds of the tokens
  // in the same request share the same tier
  const promptTokens = totalInputTokens + cacheWriteTokens.shortLife + cacheWriteTokens.longLife;

  // Falls back to the normal input price if the model doesn't declare a price for the cached tokens
  const cachedPrice = cost1MCachedTokens ?? cost1MInputTokens;
  let totalCost =
    _calcTokenCost(totalInputTokens - cachedInputTokens, cost1MInputTokens, promptTokens) +
    _calcTokenCost(outputTokens, cost1MOutputTokens, promptTokens) +
    _calcTokenCost(cachedInputTokens, cachedPrice, promptTokens);

  if (cost1MCachedTokensWrite)
    totalCost += _calcCacheWriteCost(
      cacheWriteTokens.shortLife,
      cacheWriteTokens.longLife,
      cost1MCachedTokensWrite,
      promptTokens
    );
  return totalCost;
}
