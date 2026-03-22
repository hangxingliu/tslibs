/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { ReadonlyDeep } from "type-fest";
import type { AnthropicCacheWritePrice, ModelMetadata, ModelTokenPrice } from "./types.js";

const ONE_MILLION_TOKENS = 1_000_000;

export function filterModelMetadata<Metadata extends ModelMetadata = ModelMetadata>(
  modelName: string,
  metadata: ReadonlyArray<ReadonlyDeep<Metadata>>
): Array<ReadonlyDeep<Metadata>> {
  modelName = modelName.toLowerCase().replace(/^models\//, "") as Lowercase<string>;
  const result: Array<ReadonlyDeep<Metadata>> = [];
  for (const item of metadata) {
    if (item.name === modelName) return [item];
    for (const prefix of item.prefixes) {
      if (modelName.startsWith(prefix)) {
        result.push(item);
        break;
      }
    }
  }
  return result;
}

function _calcTokenCost(tokens: number, price: ModelTokenPrice) {
  if (tokens <= 0) return 0;
  if (typeof price === "number") return (tokens * price) / ONE_MILLION_TOKENS;
  for (let i = 0; i < price.length - 1; i++) {
    if (tokens <= price[i].gt) continue;
    return (tokens * price[i].price) / ONE_MILLION_TOKENS;
  }
  return (tokens * price[price.length - 1].price) / ONE_MILLION_TOKENS;
}

function _calcCacheWriteCost(
  shortLife: number,
  longLife: number,
  price: ModelTokenPrice | Readonly<AnthropicCacheWritePrice>
) {
  let cost = 0;
  const isAnthropicPrice = typeof price === "object" && "shortLife" in price;
  if (shortLife > 0) cost += _calcTokenCost(shortLife, isAnthropicPrice ? price.shortLife : price);
  if (longLife > 0) cost += _calcTokenCost(longLife, isAnthropicPrice ? price.longLife : price);
  return cost;
}

export function calcTokenCost(
  metadata: ReadonlyDeep<ModelMetadata>,
  totalInputTokens: number,
  outputTokens: number,
  cachedInputTokens: number = 0,
  createdCacheTokens: number | { shortLife: number; longLife: number } = 0
): number {
  const { cost1MInputTokens, cost1MOutputTokens, cost1MCachedTokens, cost1MCachedTokensWrite } = metadata;

  let totalCost =
    _calcTokenCost(totalInputTokens - cachedInputTokens, cost1MInputTokens) +
    _calcTokenCost(outputTokens, cost1MOutputTokens) +
    _calcTokenCost(cachedInputTokens, cost1MCachedTokens || 0);

  if (cost1MCachedTokensWrite) {
    totalCost +=
      typeof createdCacheTokens === "number"
        ? _calcCacheWriteCost(createdCacheTokens, 0, cost1MCachedTokensWrite)
        : _calcCacheWriteCost(createdCacheTokens.shortLife, createdCacheTokens.longLife, cost1MCachedTokensWrite);
  }
  return totalCost;
}
