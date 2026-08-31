import { expect, test, describe } from "bun:test";
import { calcThinkingBudget, setReasoningEffortForOpenAI, setThinkingLevelForGoogleAI } from "./thinking-level.js";
import { KnownModelProvider, type ModelMetadata } from "./model-metadata/types.js";

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
});

describe("setThinkingLevelForGoogleAI", () => {
  test("should set the thinking level into the config", () => {
    const model: ModelMetadata = { ...BASE_MODEL, thinking: true, thinkingLevels: { minimal: "low", high: "high" } };
    const payload: any = {};
    expect(setThinkingLevelForGoogleAI(payload, model, "minimal")).toBe("low");
    expect(payload).toEqual({ config: { thinkingConfig: { thinkingLevel: "low" } } });
  });
});

describe("calcThinkingBudget", () => {
  const thinkingModel: ModelMetadata = { ...BASE_MODEL, thinking: true };

  test("should return undefined for the models without thinking", () => {
    expect(calcThinkingBudget({ ...BASE_MODEL, thinking: false }, "high", false, 10000)).toBeUndefined();
  });

  test("should return 0 when the thinking is off", () => {
    expect(calcThinkingBudget(thinkingModel, "off", false, 10000)).toBe(0);
  });

  test("should return the minimum budget when the thinking can't be disabled", () => {
    expect(calcThinkingBudget({ ...BASE_MODEL, thinking: "force" }, "off", false, 10000)).toBe(1024);
  });

  test("should return the dynamic budget only when it is allowed", () => {
    expect(calcThinkingBudget(thinkingModel, "dynamic", true, 10000)).toBe(-1);
    expect(calcThinkingBudget(thinkingModel, "dynamic", false, 10000)).toBe(7500);
  });

  test("should calculate the budget by the ratio of the estimated output tokens", () => {
    expect(calcThinkingBudget(thinkingModel, "low", false, 10000)).toBe(2500);
    expect(calcThinkingBudget(thinkingModel, "medium", false, 10000)).toBe(5000);
    expect(calcThinkingBudget(thinkingModel, "high", false, 10000)).toBe(7500);
    expect(calcThinkingBudget(thinkingModel, "max", false, 10000)).toBe(10000);
  });

  test("should never reach the max output tokens of the request", () => {
    expect(calcThinkingBudget(thinkingModel, "max", false, 10000, 4000)).toBe(3999);
    expect(calcThinkingBudget(thinkingModel, "max", false, 10000, [8000, null, 4000])).toBe(3999);
  });

  test("should respect the max output tokens even if the model declares its own budget range", () => {
    const model: ModelMetadata = { ...thinkingModel, thinkingBudgets: [128, 24576] };
    expect(calcThinkingBudget(model, "max", false, 100000)).toBe(24576);
    expect(calcThinkingBudget(model, "max", false, 100000, 4000)).toBe(3999);
    expect(calcThinkingBudget(model, "minimal", false, 100000)).toBe(128);
  });

  test("should clamp the budget into the range of the model", () => {
    expect(calcThinkingBudget(thinkingModel, "low", false, 100)).toBe(1024);
    expect(calcThinkingBudget(thinkingModel, "max", false, 1_000_000)).toBe(32768);
  });

  test("should never return a value less than the minimum budget", () => {
    // The max output tokens is smaller than the minimum thinking budget
    expect(calcThinkingBudget(thinkingModel, "max", false, 10000, 512)).toBe(1024);
  });
});
