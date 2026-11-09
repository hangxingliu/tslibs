import { expect, test, describe } from "bun:test";
import { estimateTokensV1 } from "@hangxingliu/ai-model-metadata";
import { estimateOpenAIMessageTokens } from "./openai.js";
import { estimateGoogleContentTokens } from "./google.js";

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
