/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

import type { MessageParam, TextBlockParam } from "@anthropic-ai/sdk/resources/messages.mjs";
import type { Content, Part } from "@google/genai";
import type OpenAI from "openai";
import { enableAnthropicCache } from "./transforms.js";
import type {
  ContentBlockParam,
  DocumentBlockParam,
  ImageBlockParam,
  ToolResultBlockParam,
  ToolUseBlockParam,
} from "@anthropic-ai/sdk/resources.js";
import type { ChatCompletionContentPart, ChatCompletionMessageToolCall } from "openai/resources";
import { basename } from "node:path";

type MessageOptions = {
  cache?: "5m" | "1h";
};

export class FileInMessage {
  constructor(
    readonly mimeType: string,
    readonly fileName: string,
    readonly data: Buffer
  ) {}
  get isImage() {
    return this.mimeType.match(/^image\//);
  }

  /**
   * Creates a FileInMessage instance for an image based on the provided data and file name.
   * Determines the MIME type from the file extension in the name.
   * @param data The binary data of the image as a Buffer.
   * @param name The file name including extension (e.g., 'example.jpg').
   * @returns A new FileInMessage instance for the image.
   * @throws Error if the file name lacks a valid extension or if the extension is unsupported.
   */
  static image(data: Buffer, name: string): FileInMessage {
    name = basename(name);

    // Extract the file extension using regex (captures the part after the last dot)
    const extMatch = name.match(/\.([\w-]+)$/);
    if (!extMatch) {
      throw new Error(`Unknown format in the image name "${name}"`);
    }

    // Get the extension in lowercase for case-insensitive matching
    const ext = extMatch[1].toLowerCase();

    // Map common image extensions to their MIME types
    let mimeType: string;
    switch (ext) {
      case "jpg":
      case "jpeg":
        mimeType = "image/jpeg";
        break;
      case "png":
        mimeType = "image/png";
        break;
      case "gif":
        mimeType = "image/gif";
        break;
      case "bmp":
        mimeType = "image/bmp";
        break;
      case "webp":
        mimeType = "image/webp";
        break;
      case "svg":
        mimeType = "image/svg+xml";
        break;
      case "tiff":
      case "tif":
        mimeType = "image/tiff";
        break;
      default:
        throw new Error(`Unsupported image format "${ext}" in the name "${name}"`);
    }

    // Return a new instance with the determined MIME type and data
    return new FileInMessage(mimeType, name, data);
  }
}

/**
 * Builds the message list of the three mainstream API standards (Google AI, Anthropic and OpenAI)
 * at the same time, so the same conversation can be sent to any of them.
 */
export class MessagesBuilder {
  readonly google: Content[] = [];
  readonly openai: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  readonly anthropic: MessageParam[] = [];

  constructor(readonly system?: string) {}

  private addMessage(
    role: "assistant" | "user",
    _data: string | ReadonlyArray<string | FileInMessage>,
    opts?: MessageOptions
  ) {
    let data: ReadonlyArray<string | FileInMessage>;
    if (!Array.isArray(_data)) {
      data = [_data as string];
    } else {
      data = _data;
    }
    if (data.length === 0) return;

    const google: Part[] = [];
    const openai: Array<ChatCompletionContentPart> = [];
    const anthropic: ContentBlockParam[] = [];
    for (const item of data) {
      if (typeof item === "string") {
        google.push({ text: item });
        openai.push({ type: "text", text: item });
        anthropic.push(enableAnthropicCache<TextBlockParam>({ type: "text", text: item }, opts?.cache));
      } else if (item && typeof item === "object") {
        const { mimeType, data } = item;
        const base64Data = data.toString("base64");

        google.push({ inlineData: { mimeType, data: base64Data } });
        if (item.isImage) {
          openai.push({
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
          });
          anthropic.push(
            enableAnthropicCache<ImageBlockParam>(
              {
                type: "image",
                source: { type: "base64", media_type: mimeType as any, data: base64Data },
              },
              opts?.cache
            )
          );
        } else {
          openai.push({
            type: "file",
            file: { file_data: base64Data, filename: item.fileName },
          });
          anthropic.push(
            enableAnthropicCache<DocumentBlockParam>(
              {
                type: "document",
                source: { type: "base64", media_type: mimeType as any, data: base64Data },
              },
              opts?.cache
            )
          );
        }
      }
      // end of for
    }

    this.google.push({ role: role === "assistant" ? "model" : role, parts: google });
    this.openai.push({ role, content: openai } as any);
    this.anthropic.push({ role, content: anthropic });
  }

  addToolCall(requests: ReadonlyArray<{ callId: string; fnName: string; args: any }>) {
    const anthropic: ToolUseBlockParam[] = [];
    const google: Part[] = [];
    const openai: ChatCompletionMessageToolCall[] = [];
    for (const { callId, fnName, args } of requests) {
      anthropic.push({ type: "tool_use", id: callId, name: fnName, input: args });
      google.push({ functionCall: { id: callId, name: fnName, args } });
      openai.push({ type: "function", id: callId, function: { name: fnName, arguments: JSON.stringify(args) } });
    }
    //
    this.google.push({ role: "model", parts: google });
    this.anthropic.push({ role: "assistant", content: anthropic });
    this.openai.push({ role: "assistant", tool_calls: openai });
  }

  addToolResult(
    results: ReadonlyArray<{ callId: string; fnName: string; output?: any; error?: any }>,
    opts?: MessageOptions
  ) {
    const anthropic: ToolResultBlockParam[] = [];
    const google: Part[] = [];
    for (const { callId, output, fnName, error } of results) {
      this.openai.push({ role: "tool", tool_call_id: callId, content: JSON.stringify({ output, error }) });

      let anthropicResult = error || output;
      if (typeof anthropicResult == "object") anthropicResult = JSON.stringify(anthropicResult);

      anthropic.push(
        enableAnthropicCache<ToolResultBlockParam>(
          { type: "tool_result", tool_use_id: callId, content: anthropicResult, is_error: Boolean(error) },
          opts?.cache
        )
      );
      google.push({
        functionResponse: {
          id: callId,
          name: fnName,
          response: { output, error },
        },
      });
    }
    this.google.push({ role: "model", parts: google });
    this.anthropic.push({ role: "user", content: anthropic });
  }

  addUserMessage(data: string | ReadonlyArray<string | FileInMessage>, opts?: MessageOptions) {
    return this.addMessage("user", data, opts);
  }

  addModelMessage(data: string | ReadonlyArray<string | FileInMessage>, opts?: MessageOptions) {
    return this.addMessage("assistant", data, opts);
  }
}
