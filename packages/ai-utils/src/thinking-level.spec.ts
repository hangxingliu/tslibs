import { expect, test, describe } from "bun:test";
import { setReasoningEffortForOpenAI, setThinkingLevelForGoogleAI } from "./thinking-level.js";
import { KnownModelProvider, type ModelMetadata } from "@hangxingliu/ai-model-metadata";

const BASE_MODEL = {
  provider: KnownModelProvider.ANTHROPIC,
  name: "test-model",
  prefixes: ["test-model"],
  cost1MInputTokens: 1,
  cost1MOutputTokens: 1,
} satisfies ModelMetadata;

describe("setReasoningEffortForOpenAI", () => {
  test("should write into a nested property path", () => {
    const model: ModelMetadata = {
      ...BASE_MODEL,
      thinking: true,
      thinkingLevels: { high: "high", max: "xhigh" },
      thinkingLevelProps: "reasoning.effort",
    };
    const payload: any = {};
    expect(setReasoningEffortForOpenAI(payload, model, "max")).toBe("xhigh");
    expect(payload).toEqual({ reasoning: { effort: "xhigh" } });
  });

  test("should replace the `dynamic` level by the fallback level", () => {
    const model: ModelMetadata = { ...BASE_MODEL, thinking: true, thinkingLevels: { low: "low", high: "high" } };
    const payload: any = {};
    expect(setReasoningEffortForOpenAI(payload, model, "dynamic")).toBe("low");
    expect(payload).toEqual({ reasoning_effort: "low" });
  });

  test("should do nothing for the models without thinking levels", () => {
    const payload: any = {};
    expect(setReasoningEffortForOpenAI(payload, { ...BASE_MODEL, thinking: "force" }, "high")).toBeUndefined();
    expect(setReasoningEffortForOpenAI(payload, { ...BASE_MODEL, thinking: false }, "high")).toBeUndefined();
    expect(payload).toEqual({});
  });

  test("should do nothing when the thinking is off", () => {
    const model: ModelMetadata = { ...BASE_MODEL, thinking: true, thinkingLevels: { low: "low" } };
    const payload: any = {};
    expect(setReasoningEffortForOpenAI(payload, model, "off")).toBeUndefined();
    expect(payload).toEqual({});
  });

  test("should write the mapped value when the model can disable reasoning", () => {
    const model: ModelMetadata = { ...BASE_MODEL, thinking: true, thinkingLevels: { off: "none", low: "low" } };
    const payload: any = {};
    expect(setReasoningEffortForOpenAI(payload, model, "off")).toBe("none");
    expect(payload).toEqual({ reasoning_effort: "none" });
  });
});

describe("setThinkingLevelForGoogleAI", () => {
  test("should set the thinking level into the config", () => {
    const model: ModelMetadata = { ...BASE_MODEL, thinking: true, thinkingLevels: { minimal: "low", high: "high" } };
    const payload: any = {};
    expect(setThinkingLevelForGoogleAI(payload, model, "minimal")).toBe("low");
    expect(payload).toEqual({ config: { thinkingConfig: { thinkingLevel: "low" } } });
  });
});
