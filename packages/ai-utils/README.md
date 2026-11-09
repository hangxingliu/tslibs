# `@hangxingliu/ai-utils`

Utilities for talking to the Google AI, Anthropic and OpenAI APIs through one shared abstraction:
message builders, chat payloads, tool calls and normalized token usage.

Model catalogs, prices, `estimateTokensV1` and `calcThinkingBudget` live in
[`@hangxingliu/ai-model-metadata`](https://www.npmjs.com/package/@hangxingliu/ai-model-metadata).

## Install

```bash
npm install @hangxingliu/ai-utils
```

`@hangxingliu/ai-model-metadata` is a runtime dependency and is installed with this package.

## ESM only

This package ships ESM only (`"type": "module"`). It does not include a CommonJS build.
`require()` works on Node.js 22.12 or newer, which can load an ESM module from `require()`.
The package does not use top-level await.

With `skipLibCheck` left off, `@google/genai` can still report a missing `@modelcontextprotocol/sdk`
module. That error comes from the Google SDK's declaration files.

## Migrating to 2.0

2.0.0 removes the CommonJS build (`cjs/` and the `require` export condition).
Load this package with `import`, or with `require()` on Node.js 22.12 or newer.

The root entry no longer re-exports model metadata. Import the following from
`@hangxingliu/ai-model-metadata`:

- `ALL_MODELS`, `AllModelNames`, `AllModelPrefixes`
- `ANTHROPIC_MODELS`, `GOOGLE_GEMINI_MODELS`, `XAI_MODELS`
- `ModelMetadata`, `ModelTokenPrice`, `AnthropicCacheWritePrice`
- `KnownModelProvider`, `WellknownThinkingLevel`
- `filterModelMetadata`, `calcTokenCost`
- `estimateTokensV1`
- `calcThinkingBudget`

```typescript
import { Usage } from "@hangxingliu/ai-utils";
import {
  ALL_MODELS,
  calcThinkingBudget,
  calcTokenCost,
  estimateTokensV1,
} from "@hangxingliu/ai-model-metadata";
```
