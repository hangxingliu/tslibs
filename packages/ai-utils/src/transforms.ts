/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

import type { Content, Part } from "@google/genai";
import type { TextBlockParam } from "@anthropic-ai/sdk/resources/messages";

type CacheControlObject = Pick<TextBlockParam, "cache_control">;

/**
 * Marks a content block as a prompt cache breakpoint of the Anthropic API.
 *
 * @param message A content block, or a plain string that is converted into a text block
 * @param ttl The lifetime of the cache. **The cache is not enabled when it is missing**, so the
 * caller can always pass an optional configuration value into this function.
 * @see https://platform.claude.com/docs/en/build-with-claude/prompt-caching
 */
export function enableAnthropicCache<T extends CacheControlObject | string = CacheControlObject>(
  message: T,
  ttl?: "5m" | "1h"
): T extends string ? TextBlockParam : T {
  const block = (typeof message === "string" ? { type: "text", text: message } : message) as TextBlockParam;
  if (ttl) block.cache_control = { type: "ephemeral", ttl };
  return block as any;
}

/** Adds the `models/` scope into the model name if it is absent */
export function getGoogleAIModelName(model: string): `models/${string}` {
  if (model.indexOf("/") < 0) return `models/${model}`;
  return model as any;
}

/**
 * Normalizes all the accepted message shapes into a Google AI {@link Content} array.
 * @param role The role assigned to the contents that don't have their own role
 */
export function messageToGoogleAIContentsArray(
  message: Content | Content[] | string | Part | ReadonlyArray<string | Part> | null | undefined,
  role: "user" | "model"
): Content[] {
  if (typeof message === "string") return [{ parts: [{ text: message }], role }];
  if (!message) return [];

  if (Array.isArray(message)) return message.map((it) => messageToGoogleAIContentsArray(it, role)).flat();

  const content = message as Content;
  // A `Content` object always owns `parts` and/or `role`, and a `Part` object owns neither of them
  if (content.parts || content.role) return [content.role ? content : { ...content, role }];
  return [{ parts: [message as Part], role }];
}
