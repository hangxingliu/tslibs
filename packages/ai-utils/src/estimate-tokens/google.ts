/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { Content, Part } from "@google/genai";

import { estimateTokensV1 } from "./base.js";
import { messageToGoogleAIContentsArray } from "../transforms.js";

export function estimateGoogleContentTokens(
  message: Content | Content[] | string | Part | ReadonlyArray<string | Part> | null | undefined
) {
  const messages = messageToGoogleAIContentsArray(message, "user");
  let count = 0;
  for (const msg of messages) {
    if (!msg.parts) continue;
    for (const part of msg.parts) if (part.text) count += estimateTokensV1(part.text);
  }
  return count;
}
