import { expect, test, describe } from "bun:test";
import { calcTokenCost, filterModelMetadata } from "./utils.js";
import { KnownModelProvider, type ModelMetadata } from "./types.js";
import { ALL_MODELS } from "./index.js";

const TIERED_MODEL = {
  provider: KnownModelProvider.XAI,
  name: "test-model",
  prefixes: ["test-model"],
  cost1MInputTokens: [
    { gt: 200_000, price: 4 },
    { gt: 0, price: 2 },
  ],
  cost1MOutputTokens: 10,
  cost1MCachedTokens: 1,
  cost1MCachedTokensWrite: { shortLife: 20, longLife: 40 },
} as const satisfies ModelMetadata;

describe("filterModelMetadata", () => {
  test("should return the exact match only", () => {
    const result = filterModelMetadata("claude-sonnet-4-6", ALL_MODELS);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("claude-sonnet-4-6");
  });

  test("should ignore the case and the `models/` scope", () => {
    const result = filterModelMetadata("models/Gemini-3.6-Flash", ALL_MODELS);
    expect(result[0].name).toBe("gemini-3.6-flash");
  });

  test("should keep the order of the given metadata for the prefix matches", () => {
    // `grok-4.20-non-reasoning-latest-xxx` matches the prefix `grok-4.20-non-reasoning` and
    // the more generic prefix `grok-4.20`
    const result = filterModelMetadata("grok-4.20-non-reasoning-latest-xxx", ALL_MODELS);
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].name).toBe("grok-4.20-non-reasoning-latest");
  });

  test("should prefer the newest item instead of the longest matched prefix", () => {
    const models = [
      { ...TIERED_MODEL, name: "test-model-new", prefixes: ["test-model"] },
      { ...TIERED_MODEL, name: "test-model-old", prefixes: ["test-model-2026"] },
    ] satisfies ModelMetadata[];
    const result = filterModelMetadata("test-model-2026-01-01", models);
    expect(result.map((it) => it.name)).toEqual(["test-model-new", "test-model-old"]);
  });

  test("should return an empty array for an unknown model", () => {
    expect(filterModelMetadata("unknown-model-name", ALL_MODELS)).toEqual([]);
  });

  test("should resolve the current model aliases", () => {
    expect(filterModelMetadata("claude-sonnet-5-5-latest", ALL_MODELS)[0].name).toBe("claude-sonnet-5-5");
    expect(filterModelMetadata("grok-build-latest", ALL_MODELS)[0].name).toBe("grok-4.5");
    expect(filterModelMetadata("grok-code-fast-1", ALL_MODELS)[0].name).toBe("grok-build-0.1");
    expect(filterModelMetadata("grok-code-fast-1-0825", ALL_MODELS)[0].name).toBe("grok-build-0.1");
  });
});

describe("calcTokenCost", () => {
  test("should use the tiered price matching the prompt size", () => {
    // 100K tokens => the price of the tier `gt: 0`
    expect(calcTokenCost(TIERED_MODEL, 100_000, 0)).toBeCloseTo(0.2, 6);
    // 300K tokens => the price of the tier `gt: 200_000`
    expect(calcTokenCost(TIERED_MODEL, 300_000, 0)).toBeCloseTo(1.2, 6);
  });

  test("should bill the output tokens by the tier of the prompt size", () => {
    // A small output of a long context request is still billed at the long context price
    expect(calcTokenCost(TIERED_MODEL, 300_000, 1_000)).toBeCloseTo(1.2 + 0.01, 6);
  });

  test("should exclude the cached tokens from the normal input tokens", () => {
    // (1M - 200K) * $4 + 200K * $1 (the prompt reaches the long context tier)
    expect(calcTokenCost(TIERED_MODEL, 1_000_000, 0, 200_000)).toBeCloseTo(3.2 + 0.2, 6);
  });

  test("should charge the cache write tokens by their own prices", () => {
    expect(calcTokenCost(TIERED_MODEL, 0, 0, 0, { shortLife: 1_000_000, longLife: 1_000_000 })).toBeCloseTo(60, 6);
  });

  test("should fall back to the input price when the cached price is absent", () => {
    const model = { ...TIERED_MODEL, cost1MCachedTokens: undefined } satisfies ModelMetadata;
    expect(calcTokenCost(model, 100_000, 0, 100_000)).toBeCloseTo(0.2, 6);
  });

  test("should calculate the output tokens", () => {
    expect(calcTokenCost(TIERED_MODEL, 0, 1_000_000)).toBeCloseTo(10, 6);
  });

  test("should bill Claude Haiku 5.5 by the 100k prompt tier", () => {
    const model = filterModelMetadata("claude-haiku-5-5", ALL_MODELS)[0];
    // 100,000 tokens is still the lower tier. 100k input + 1M output.
    expect(calcTokenCost(model, 100_000, 1_000_000)).toBeCloseTo(0.01 + 0.5, 6);
    // One token past the threshold bills the whole request at the higher rate.
    expect(calcTokenCost(model, 100_001, 1_000_000)).toBeCloseTo((100_001 * 0.5) / 1_000_000 + 2.5, 6);
    // Cache writes count toward the prompt length and use the same tier.
    expect(calcTokenCost(model, 0, 0, 0, { shortLife: 100_000, longLife: 0 })).toBeCloseTo(0.0125, 6);
    expect(calcTokenCost(model, 50_000, 0, 0, { shortLife: 60_000, longLife: 0 })).toBeCloseTo(
      (50_000 * 0.5) / 1_000_000 + (60_000 * 0.625) / 1_000_000,
      6
    );
  });

  test("should price routed Gemini 3.5 Flash at the Gemini 3.6 Flash promotional rate", () => {
    const flash35 = filterModelMetadata("gemini-3.5-flash", ALL_MODELS)[0];
    const flash36 = filterModelMetadata("gemini-3.6-flash", ALL_MODELS)[0];
    expect(calcTokenCost(flash35, 1_000_000, 1_000_000)).toBeCloseTo(calcTokenCost(flash36, 1_000_000, 1_000_000), 6);
    expect(calcTokenCost(flash35, 1_000_000, 0)).toBeCloseTo(0.75, 6);
  });
});
