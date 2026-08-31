import { expect, test, describe } from "bun:test";
import { Usage } from "./usage.js";
import { filterModelMetadata } from "./model-metadata/utils.js";
import { ALL_MODELS } from "./model-metadata/index.js";

describe("Usage.fromAnthropic", () => {
  test("should sum up the cache read tokens into the total input tokens", () => {
    const usage = Usage.fromAnthropic({
      input_tokens: 25,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 100,
      cache_creation: { ephemeral_5m_input_tokens: 10, ephemeral_1h_input_tokens: 20 },
      output_tokens: 1133,
    });
    expect(usage.totalInputTokens).toBe(125);
    expect(usage.cachedInputTokens).toBe(100);
    expect(usage.outputTokens).toBe(1133);
    expect(usage.cacheCreationTokens).toBe(10);
    expect(usage.longLifeCacheCreationTokens).toBe(20);
  });

  test("should fall back to `cache_creation_input_tokens`", () => {
    const usage = Usage.fromAnthropic({
      input_tokens: 25,
      cache_creation_input_tokens: 64,
      cache_read_input_tokens: 0,
      cache_creation: null,
      output_tokens: 1,
    });
    expect(usage.cacheCreationTokens).toBe(64);
    expect(usage.longLifeCacheCreationTokens).toBe(0);
  });

  test("should calculate the cost of a known model", () => {
    const usage = Usage.fromAnthropic({
      input_tokens: 1_000_000,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation: null,
      output_tokens: 0,
    });
    const [model] = filterModelMetadata("claude-sonnet-4-6", ALL_MODELS);
    expect(model).toBeTruthy();
    expect(Usage.getCost(usage, model)).toBeCloseTo(3, 6);
  });
});

describe("Usage.fromGoogle", () => {
  test("should sum up the candidates tokens and the thinking tokens", () => {
    const usage = Usage.fromGoogle({
      promptTokenCount: 100,
      cachedContentTokenCount: 40,
      candidatesTokenCount: 20,
      thoughtsTokenCount: 30,
      totalTokenCount: 150,
    });
    expect(usage.totalInputTokens).toBe(100);
    expect(usage.cachedInputTokens).toBe(40);
    expect(usage.outputTokens).toBe(50);
  });

  test("should fall back to the total token count", () => {
    const usage = Usage.fromGoogle({ promptTokenCount: 100, totalTokenCount: 150 });
    expect(usage.outputTokens).toBe(50);
  });
});

describe("Usage.fromOpenAI", () => {
  test("should keep the cached tokens inside the total input tokens", () => {
    const usage = Usage.fromOpenAI({
      prompt_tokens: 100,
      completion_tokens: 10,
      prompt_tokens_details: { cached_tokens: 40 },
    });
    expect(usage.totalInputTokens).toBe(100);
    expect(usage.cachedInputTokens).toBe(40);
    expect(usage.outputTokens).toBe(10);
  });
});
