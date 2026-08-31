/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { estimateTokensV1 } from "./base.js";
import type { MessageParam, TextBlockParam } from "@anthropic-ai/sdk/resources";
import type { ChatCompletionMessageParam } from "openai/resources";

/**
 * Estimates the input tokens of the messages declared in the OpenAI standard.
 * Only the text parts are counted, the images/files are ignored.
 */
export function estimateOpenAIMessageTokens(
  message:
    | string
    | ReadonlyArray<
        | string
        | Pick<TextBlockParam, "text">
        | Pick<MessageParam, "content">
        | Pick<ChatCompletionMessageParam, "content">
      >
) {
  let count = 0;
  if (typeof message === "string") return estimateTokensV1(message);
  for (const msg of message) {
    if (typeof msg === "string") {
      count += estimateTokensV1(msg);
      continue;
    }
    if ("text" in msg && typeof msg.text === "string") {
      count += estimateTokensV1(msg.text);
      continue;
    }
    if ("content" in msg) {
      const { content } = msg;
      if (typeof content === "string") {
        count += estimateTokensV1(content);
        continue;
      }
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type !== "text" || !item.text) continue;
          count += estimateTokensV1(item.text);
        }
      }
    }
    //
  }
  return count;
}
