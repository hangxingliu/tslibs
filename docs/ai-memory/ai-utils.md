# `@hangxingliu/ai-utils`

Utilities for talking to the three mainstream LLM API standards (**Google AI**, **Anthropic** and
**OpenAI**) through one shared abstraction.

Model catalogs, token prices, `estimateTokensV1` and `calcThinkingBudget` come from
[`@hangxingliu/ai-model-metadata`](./ai-model-metadata.md). This package depends on that package at runtime.

## Layout

| Path | Responsibility |
| ---- | -------------- |
| `src/types.ts` | Aliases of the request/tool types of the three SDKs |
| `src/messages-builder.ts` | Builds the message list of the three standards from the same conversation |
| `src/chat-param-builder.ts` | Builds the complete chat completion payloads of the three standards |
| `src/thinking-level.ts` | Maps the wellknown thinking levels into the provider specific parameters. Numeric budgets are calculated by `calcThinkingBudget` from `@hangxingliu/ai-model-metadata` |
| `src/estimate-tokens/` | Rough offline token estimation of provider message shapes. The shared heuristic `estimateTokensV1` comes from `@hangxingliu/ai-model-metadata` |
| `src/call-tools/` | Executes the tool/function calls contained in a response |
| `src/tools.ts`, `src/transforms.ts` | Small converters shared by the modules above |
| `src/usage.ts` | Normalizes the token usage of the three standards and calculates the cost |

## Conventions that must be kept

### Token usage

`Usage` is provider-independent, and all the factories (`Usage.fromGoogle`, `Usage.fromAnthropic`,
`Usage.fromOpenAI`) must produce the same semantics:

- `totalInputTokens` **contains** `cachedInputTokens`, and it **excludes** the cache creation tokens
  (they are billed by the cache write prices instead).
  Anthropic is special here: its `input_tokens` contains neither of them, so the cache read tokens
  must be summed up manually.
- `outputTokens` **contains** the reasoning/thinking tokens.
  For Google AI it is `candidatesTokenCount + thoughtsTokenCount`, and `totalTokenCount` minus the
  input tokens is only the fallback.

### Prices

Price tables and `calcTokenCost` live in [`@hangxingliu/ai-model-metadata`](./ai-model-metadata.md).
`Usage.getCost` delegates to that function. Keep the price conventions documented there.

### Thinking / reasoning

Two mutually exclusive mechanisms are supported by the models:

1. **Thinking level** — a text value written into `reasoning_effort` (OpenAI), `output_config.effort`
   (Anthropic) or `thinkingConfig.thinkingLevel` (Gemini 3+). Declared by `ModelMetadata.thinkingLevels`
   and `ModelMetadata.thinkingLevelProps`. Gemini 3.8 Flash and Gemini 3.1 Pro reject `minimal`
   (it is sent as `low`). `gemini-3.7-flash` is routed to Gemini 3.8 Flash and uses the same levels.
   `grok-4.5` and later accept `xhigh`, which the wellknown level `max` maps to. `grok-4.3` also
   accepts `xhigh`, and its `off` level is sent as `none`. Claude's `xhigh` effort has no wellknown
   level; `max` maps to Claude's `max`.
2. **Thinking budget** — a token count written into `thinking.budget_tokens` (Anthropic) or
   `thinkingConfig.thinkingBudget` (Gemini 2). It is used only when the model doesn't accept a
   thinking level. The number is produced by `calcThinkingBudget` from
   [`@hangxingliu/ai-model-metadata`](./ai-model-metadata.md). That document owns the budget range
   and the `-1` dynamic-budget convention.

### Messages

- The function/tool responses are sent back by the client side, so their Google AI role is `user`
  (not `model`), and their Anthropic role is `user` too.
- The OpenAI standard requires a Base64 **data URL** in `file.file_data` and `image_url.url`, while
  Google AI and Anthropic accept the raw Base64 string.
- The prompt cache breakpoint (`cache_control`) is an Anthropic only field, and it is added only
  when a TTL is given.

### Tool calls

`callToolsForGoogle` / `callToolsForAnthropic` / `callToolsForOpenAI` never throw: all the failures
(unknown function name, malformed arguments, an error thrown by the implementation) are collected
into the returned `errors` array. The function implementations are looked up by
`resolveToolImplementation`, which accepts the own properties of the tools object **and** the
methods declared by its own class(es) (so `new ToolsImpl()` works), but it stops the prototype
chain walk before `Object.prototype` / `Function.prototype` and rejects the names `__proto__`,
`constructor` and `prototype` to avoid prototype pollution.

## Testing

```bash
# at the directory of this package
bun test src
bun run build      # ESM + type checking
bun run lint
```

`@hangxingliu/ai-utils` 2.0.0 is ESM only. It does not emit a `cjs/` build.
`require()` can load it on Node.js 22.12 or newer. The package does not use top-level await.
`@hangxingliu/common-utils` 3.0.0 and `@hangxingliu/cli-utils` 7.0.0 are ESM only as well.
See [module-format.md](./module-format.md).
