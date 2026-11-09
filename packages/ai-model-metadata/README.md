# `@hangxingliu/ai-model-metadata`

SDK-independent metadata for LLM models: prices, context limits and thinking capabilities.
The package does not depend on any AI SDK. Add a model by editing the catalog of its provider
(`src/google.ts`, `src/xai.ts` or `src/anthropic.ts`).

## Install

```bash
npm install @hangxingliu/ai-model-metadata
```

## ESM only

This package ships ESM only (`"type": "module"`). It does not include a CommonJS build.
`require()` works on Node.js 22.12 or newer, which can load an ESM module from `require()`.
The package does not use top-level await.

## Examples

```typescript
import { ALL_MODELS, calcTokenCost, filterModelMetadata } from "@hangxingliu/ai-model-metadata";

const [model] = filterModelMetadata("gemini-3-flash-preview", ALL_MODELS);
if (model) {
  // USD cost of 1,000 input tokens and 500 output tokens.
  const usd = calcTokenCost(model, 1_000, 500);
  console.log(model.name, usd);
}
```

`filterModelMetadata` returns an exact name match alone. Otherwise it returns every prefix match in
the same order as `ALL_MODELS`, which is newest model first. `result[0]` is the newest match.
