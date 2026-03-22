/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

import type { Content, Part } from "@google/genai";
import type { TextBlockParam } from "@anthropic-ai/sdk/resources/messages";

type CacheControlObject = Pick<TextBlockParam, "cache_control">;

export function enableAnthropicCache<T extends CacheControlObject | string = CacheControlObject>(
  message: T,
  ttl?: "5m" | "1h"
): T extends string ? TextBlockParam : T {
  const block = (typeof message === "string" ? { type: "text", text: message } : message) as TextBlockParam;
  if (ttl) block.cache_control = { type: "ephemeral", ttl };
  return block as any;
}

export function getGoogleAIModelName(model: string): `models/${string}` {
  if (model.indexOf("/") < 0) return `models/${model}`;
  return model as any;
}

export function messageToGoogleAIContentsArray(
  message: Content | Content[] | string | Part | ReadonlyArray<string | Part> | null | undefined,
  role: "user" | "model"
): Content[] {
  if (typeof message === "string") return [{ parts: [{ text: message }], role }];
  if (!message) return [];

  if (Array.isArray(message)) return message.map((it) => messageToGoogleAIContentsArray(it, role)).flat();

  if ((message as Content).parts || (message as Content).role) return [message as Content];
  return [{ parts: [message as Part], role }];
}
