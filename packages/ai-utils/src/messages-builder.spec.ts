import { expect, test, describe } from "bun:test";
import { FileInMessage, MessagesBuilder } from "./messages-builder.js";
import { messageToGoogleAIContentsArray } from "./transforms.js";

describe("MessagesBuilder", () => {
  test("should build the text messages of the three standards", () => {
    const builder = new MessagesBuilder("system prompt");
    builder.addUserMessage("hello");
    builder.addModelMessage("world");

    expect(builder.google).toEqual([
      { role: "user", parts: [{ text: "hello" }] },
      { role: "model", parts: [{ text: "world" }] },
    ]);
    expect(builder.openai).toEqual([
      { role: "user", content: [{ type: "text", text: "hello" }] },
      { role: "assistant", content: [{ type: "text", text: "world" }] },
    ] as any);
    expect(builder.anthropic).toEqual([
      { role: "user", content: [{ type: "text", text: "hello" }] },
      { role: "assistant", content: [{ type: "text", text: "world" }] },
    ]);
  });

  test("should enable the Anthropic prompt cache on demand", () => {
    const builder = new MessagesBuilder();
    builder.addUserMessage("hello", { cache: "1h" });
    expect(builder.anthropic[0].content).toEqual([
      { type: "text", text: "hello", cache_control: { type: "ephemeral", ttl: "1h" } },
    ]);
    // The cache control is an Anthropic only field
    expect(builder.openai[0].content).toEqual([{ type: "text", text: "hello" }] as any);
  });

  test("should encode a non-image file as a Base64 data URL for the OpenAI standard", () => {
    const builder = new MessagesBuilder();
    const data = Buffer.from("hello");
    builder.addUserMessage([new FileInMessage("application/pdf", "a.pdf", data)]);

    const base64 = data.toString("base64");
    expect(builder.openai[0].content).toEqual([
      { type: "file", file: { file_data: `data:application/pdf;base64,${base64}`, filename: "a.pdf" } },
    ] as any);
  });

  test("should send the function responses with the `user` role for Google AI", () => {
    const builder = new MessagesBuilder();
    builder.addToolCall([{ callId: "call-1", fnName: "get_time", args: {} }]);
    builder.addToolResult([{ callId: "call-1", fnName: "get_time", output: { time: 1 } }]);

    expect(builder.google[0].role).toBe("model");
    expect(builder.google[1].role).toBe("user");
    expect(builder.anthropic[1].role).toBe("user");
  });

  test("should serialize the non-string tool results for Anthropic", () => {
    const builder = new MessagesBuilder();
    builder.addToolResult([
      { callId: "call-1", fnName: "f1", output: { ok: true } },
      { callId: "call-2", fnName: "f2", output: "plain text" },
      { callId: "call-3", fnName: "f3", error: new Error("failed") },
    ]);
    const blocks = builder.anthropic[0].content as any[];
    expect(blocks[0].content).toBe('{"ok":true}');
    expect(blocks[0].is_error).toBe(false);
    expect(blocks[1].content).toBe("plain text");
    expect(blocks[2].is_error).toBe(true);
  });

  test("should ignore the empty message lists", () => {
    const builder = new MessagesBuilder();
    builder.addToolCall([]);
    builder.addToolResult([]);
    builder.addUserMessage([]);
    expect(builder.google).toEqual([]);
    expect(builder.openai).toEqual([]);
    expect(builder.anthropic).toEqual([]);
  });
});

describe("FileInMessage.image", () => {
  test("should resolve the MIME type from the file name", () => {
    const file = FileInMessage.image(Buffer.alloc(0), "/tmp/photo.JPG");
    expect(file.mimeType).toBe("image/jpeg");
    expect(file.fileName).toBe("photo.JPG");
    expect(file.isImage).toBe(true);
  });

  test("should throw for the unknown image formats", () => {
    expect(() => FileInMessage.image(Buffer.alloc(0), "photo")).toThrow();
    expect(() => FileInMessage.image(Buffer.alloc(0), "photo.txt")).toThrow();
  });
});

describe("messageToGoogleAIContentsArray", () => {
  test("should normalize all the accepted shapes", () => {
    expect(messageToGoogleAIContentsArray("hi", "user")).toEqual([{ role: "user", parts: [{ text: "hi" }] }]);
    expect(messageToGoogleAIContentsArray(null, "user")).toEqual([]);
    expect(messageToGoogleAIContentsArray({ text: "hi" }, "model")).toEqual([
      { role: "model", parts: [{ text: "hi" }] },
    ]);
  });

  test("should fill the missing role of a content object", () => {
    expect(messageToGoogleAIContentsArray({ parts: [{ text: "hi" }] }, "model")).toEqual([
      { role: "model", parts: [{ text: "hi" }] },
    ]);
  });

  test("should keep the role declared by the content object", () => {
    expect(messageToGoogleAIContentsArray({ role: "user", parts: [{ text: "hi" }] }, "model")).toEqual([
      { role: "user", parts: [{ text: "hi" }] },
    ]);
  });
});
