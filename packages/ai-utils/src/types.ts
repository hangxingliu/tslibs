/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { GenerateContentParameters, Tool as GoogleAITool } from "@google/genai";
import type {
  MessageCreateParamsNonStreaming,
  MessageCreateParamsStreaming,
  Tool as AnthropicAITool,
} from "@anthropic-ai/sdk/resources";
import type { OpenAI as _OpenAI } from "openai";

export namespace ChatParams {
  export type Google = GenerateContentParameters;
  export type Anthropic = MessageCreateParamsNonStreaming;
  export type OpenAI = _OpenAI.ChatCompletionCreateParamsNonStreaming;
}

export namespace StreamChatParams {
  export type Google = GenerateContentParameters;
  export type Anthropic = MessageCreateParamsStreaming;
  export type OpenAI = _OpenAI.ChatCompletionCreateParamsStreaming;
}

export namespace Tools {
  export type Google = GoogleAITool;
  export type Anthropic = AnthropicAITool;
  export type OpenAI = Required<_OpenAI.ChatCompletionCreateParamsNonStreaming>["tools"][0];
}
