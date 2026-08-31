import { expect, test, describe } from "bun:test";
import { ChatParamsBuilder } from "./chat-param-builder.js";
import { MessagesBuilder } from "./messages-builder.js";
import { KnownModelProvider, type ModelMetadata } from "./model-metadata/types.js";

const ANTHROPIC_MODEL: ModelMetadata = {
  provider: KnownModelProvider.ANTHROPIC,
  name: "claude-test-1",
  prefixes: ["claude-test-1"],
  cost1MInputTokens: 1,
  cost1MOutputTokens: 1,
  maxOutputTokens: 64_000,
  thinking: true,
};

const GEMINI_3_MODEL: ModelMetadata = {
  provider: KnownModelProvider.GOOGLE,
  name: "gemini-test-3",
  prefixes: ["gemini-test-3"],
  cost1MInputTokens: 1,
  cost1MOutputTokens: 1,
  maxOutputTokens: 65_536,
  thinking: true,
  thinkingLevels: { low: "low", medium: "medium", high: "high", max: "high" },
};

function createMessages(system?: string) {
  const messages = new MessagesBuilder(system);
  messages.addUserMessage("hello");
  return messages;
}

describe("ChatParamsBuilder", () => {
  test("should put the system prompt into all the payloads", () => {
    const builder = new ChatParamsBuilder(ANTHROPIC_MODEL, createMessages("be nice"));
    expect(builder.google.config?.systemInstruction).toBe("be nice");
    expect(builder.anthropic.system).toEqual([{ type: "text", text: "be nice" }]);
    expect(builder.openai.messages[0]).toEqual({ role: "system", content: "be nice" });
  });

  test("should skip the system prompt when it is absent", () => {
    const builder = new ChatParamsBuilder(ANTHROPIC_MODEL, createMessages());
    expect(builder.google.config?.systemInstruction).toBeUndefined();
    expect(builder.anthropic.system).toBeUndefined();
    expect(builder.openai.messages.length).toBe(1);
    expect(builder.openai.messages[0].role).toBe("user");
  });

  test("should always set the required `max_tokens` of the Anthropic payload", () => {
    const model: ModelMetadata = { ...ANTHROPIC_MODEL, maxOutputTokens: undefined };
    const builder = new ChatParamsBuilder(model, createMessages());
    expect(typeof builder.anthropic.max_tokens).toBe("number");
    expect(builder.anthropic.max_tokens).toBeGreaterThan(0);
  });

  test("should not modify the payloads of the models without thinking", () => {
    const model: ModelMetadata = { ...ANTHROPIC_MODEL, thinking: false };
    const builder = new ChatParamsBuilder(model, createMessages());
    expect(builder.setThinkingBudget("high")).toBe(0);
    expect(builder.anthropic.thinking).toBeUndefined();
    expect(builder.google.config?.thinkingConfig).toBeUndefined();
  });

  test("should return the resolved budget of the thinking level", () => {
    const builder = new ChatParamsBuilder(ANTHROPIC_MODEL, createMessages(), { estimatedOutputTokens: 10_000 });
    const budget = builder.setThinkingBudget("medium");
    expect(budget).toBe(5000);
    expect(builder.anthropic.thinking).toEqual({ type: "enabled", budget_tokens: 5000 });
  });

  test("should keep the Google thinking level instead of the numeric budget", () => {
    const builder = new ChatParamsBuilder(GEMINI_3_MODEL, createMessages(), { estimatedOutputTokens: 10_000 });
    const budget = builder.setThinkingBudget("max");
    expect(builder.google.config?.thinkingConfig).toEqual({ thinkingLevel: "high" } as any);
    // The models supporting the thinking levels don't accept a numeric budget
    expect(builder.google.config?.thinkingConfig?.thinkingBudget).toBeUndefined();
    // The budget is still resolved for the Anthropic payload
    expect(budget).toBe(10_000);
  });

  test("should increase the max output tokens by the thinking budget", () => {
    const builder = new ChatParamsBuilder(ANTHROPIC_MODEL, createMessages(), {
      estimatedOutputTokens: 10_000,
      maxOutputTokens: () => 8_000,
    });
    expect(builder.anthropic.max_tokens).toBe(8_000);
    const budget = builder.setThinkingBudget("max", true);
    // The budget must be less than the max output tokens of the request
    expect(budget).toBe(7_999);
    expect(builder.anthropic.max_tokens).toBe(15_999);
    expect(builder.openai.max_completion_tokens).toBe(15_999);
  });

  test("should disable the Anthropic thinking when a tool call is forced", () => {
    const builder = new ChatParamsBuilder(ANTHROPIC_MODEL, createMessages(), { thinking: "high" });
    expect(builder.anthropic.thinking).toBeTruthy();

    builder.bindTools(
      [{ type: "function", function: { name: "f1", parameters: { type: "object", properties: {} } } }],
      "required"
    );
    expect(builder.anthropic.thinking).toBeUndefined();
    expect(builder.anthropic.tools).toEqual([
      { type: "custom", name: "f1", description: undefined, input_schema: { type: "object", properties: {} } },
    ]);
    const googleTools = builder.google.config?.tools?.[0] as { functionDeclarations?: Array<{ name?: string }> };
    expect(googleTools?.functionDeclarations?.[0]?.name).toBe("f1");
  });
});
