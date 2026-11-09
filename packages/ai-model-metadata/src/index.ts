/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

/**
 * SDK-independent metadata of LLM models: prices, context limits and thinking capabilities.
 * This package does not depend on any AI SDK. Add a model by editing the catalog of its provider.
 */
export * from "./all-models.js";
export * from "./anthropic.js";
export * from "./estimate-tokens.js";
export * from "./google.js";
export * from "./thinking-budget.js";
export * from "./types.js";
export * from "./utils.js";
export * from "./xai.js";
