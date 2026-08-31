import { expect, test, describe } from "bun:test";
import { estimateTokensV1 } from "./base.js";
import { estimateOpenAIMessageTokens } from "./openai.js";
import { estimateGoogleContentTokens } from "./google.js";

describe("estimateTokensV1", () => {
  test("should return 0 for the empty inputs", () => {
    expect(estimateTokensV1("")).toBe(0);
    expect(estimateTokensV1([])).toBe(0);
    expect(estimateTokensV1([null, undefined])).toBe(0);
  });

  test("should estimate about one token per four ASCII characters", () => {
    // 40 characters => ~10 tokens + 2 overhead tokens
    expect(estimateTokensV1("a".repeat(40))).toBe(12);
  });

  test("should estimate about one token per two CJK characters", () => {
    // The Chinese, Japanese and Korean characters share the same ratio
    expect(estimateTokensV1("中".repeat(20))).toBe(12);
    expect(estimateTokensV1("あ".repeat(20))).toBe(12);
    expect(estimateTokensV1("한".repeat(20))).toBe(12);
  });

  test("should count the constant overhead only once for an array", () => {
    const items = ["a".repeat(40), "a".repeat(40)];
    // The array is estimated as one single text instead of two independent texts
    expect(estimateTokensV1(items)).toBeLessThan(estimateTokensV1(items[0]) + estimateTokensV1(items[1]));
  });

  test("should ignore the non-string items", () => {
    expect(estimateTokensV1(["a".repeat(40), null, undefined])).toBe(12);
  });

  test("should limit the result into the given range", () => {
    expect(estimateTokensV1("a".repeat(40), 100)).toBe(100);
    expect(estimateTokensV1("a".repeat(40), null, 5)).toBe(5);
  });
});

describe("estimateOpenAIMessageTokens", () => {
  test("should count the text of all the message shapes", () => {
    const tokens = estimateOpenAIMessageTokens([
      "hello",
      { text: "hello" },
      { content: "hello" },
      { content: [{ type: "text", text: "hello" }] },
    ]);
    expect(tokens).toBe(estimateTokensV1("hello") * 4);
  });

  test("should ignore the image parts", () => {
    const tokens = estimateOpenAIMessageTokens([
      { content: [{ type: "image_url", image_url: { url: "data:image/png;base64,aaaa" } }] },
    ]);
    expect(tokens).toBe(0);
  });
});

describe("estimateGoogleContentTokens", () => {
  test("should count the text parts only", () => {
    const tokens = estimateGoogleContentTokens([
      { role: "user", parts: [{ text: "hello" }, { inlineData: { mimeType: "image/png", data: "aaaa" } }] },
    ]);
    expect(tokens).toBe(estimateTokensV1("hello"));
  });

  test("should accept a plain string", () => {
    expect(estimateGoogleContentTokens("hello")).toBe(estimateTokensV1("hello"));
  });
});
