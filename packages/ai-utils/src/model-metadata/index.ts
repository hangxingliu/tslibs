/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { ModelMetadata } from "./types.js";
import { ANTHROPIC_MODELS } from "./anthropic.js";
import { GOOGLE_GEMINI_MODELS } from "./google.js";
import { XAI_MODELS } from "./xai.js";

type ItemType<Array extends readonly unknown[]> = Array extends readonly (infer Item)[] ? Item : never;
type ModelNames<Array extends readonly ModelMetadata[]> = ItemType<Array>["name"];
type ModelPrefixes<Array extends readonly ModelMetadata[]> = ItemType<ItemType<Array>["prefixes"]>;

export const ALL_MODELS = [...ANTHROPIC_MODELS, ...GOOGLE_GEMINI_MODELS, ...XAI_MODELS] as ModelMetadata[];

export type AllModelNames =
  | ModelNames<typeof ANTHROPIC_MODELS>
  | ModelNames<typeof GOOGLE_GEMINI_MODELS>
  | ModelNames<typeof XAI_MODELS>;

export type AllModelPrefixes =
  | ModelPrefixes<typeof ANTHROPIC_MODELS>
  | ModelPrefixes<typeof GOOGLE_GEMINI_MODELS>
  | ModelPrefixes<typeof XAI_MODELS>;
