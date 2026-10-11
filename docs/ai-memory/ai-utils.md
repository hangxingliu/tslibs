# `@hangxingliu/ai-utils`

Utilities for talking to the three mainstream LLM API standards (**Google AI**, **Anthropic** and
**OpenAI**) through one shared abstraction.

## Layout

| Path | Responsibility |
| ---- | -------------- |
| `src/types.ts` | Aliases of the request/tool types of the three SDKs |
| `src/model-metadata/` | Static metadata (prices, limits and thinking capabilities) of the known models. The active catalogs are `google.ts`, `xai.ts` and `anthropic.ts`, newest model first |
| `src/messages-builder.ts` | Builds the message list of the three standards from the same conversation |
| `src/chat-param-builder.ts` | Builds the complete chat completion payloads of the three standards |
| `src/thinking-level.ts` | Maps the wellknown thinking levels into the provider specific parameters |
| `src/estimate-tokens/` | Rough offline token estimation (no tokenizer is downloaded) |
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

- `ModelTokenPrice` is either a fixed price per 1M tokens, or a tiered price table. Each rule of the
  table takes effect when the token count is **greater than** its `gt` field.
- The tier is decided by the **size of the whole prompt** (input + cache creation tokens), and it is
  shared by all the kinds of the tokens in the same request. E.g., the output tokens of a long
  context request are billed at the long context price even if only a few tokens are generated.
- Anthropic cache reads are usually 0.1× the input price. Claude Fable 5.1 and Claude Mythos 5.1
  use 0.025× (`$0.25` / 1M). Claude Opus 5.5 uses 0.05× (`$0.20` / 1M) and Claude Sonnet 5.5 uses
  0.05× (`$0.10` / 1M). Cache writes stay at 1.25× (5-minute) and 2× (1-hour).
- Claude Haiku 5.5 (`claude-haiku-5-5`) charges more once the prompt is over 100,000 tokens
  (`$0.10` / `$0.50` below the threshold, `$0.50` / `$2.50` above, for input / output per 1M tokens).
  The prompt length includes cache reads and cache writes, and the cache-write prices use the same tier.
- The standard prices stored for `gemini-3.8-flash` and `gemini-3.6-flash` are the promotional rates
  valid through December 31, 2026. They double on January 1, 2027. Requests to `gemini-3.7-flash`
  are routed to `gemini-3.8-flash`, and requests to `gemini-3.5-flash` are routed to
  `gemini-3.6-flash`, so those entries store the same promotional rates.
- Claude Mythos 5.1 (`claude-mythos-5-1`) and Claude Mythos 5 (`claude-mythos-5`) are limited to
  organizations verified through Anthropic's verification programs. Their prices and limits match
  Claude Fable 5.1 and Claude Fable 5.
- `filterModelMetadata` returns the prefix matches in the same order as the given metadata array,
  which is ordered from the newest model to the oldest one. So `result[0]` is the newest matched
  model instead of the one owning the longest matched prefix.

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
   thinking level.

The resolved budget must always be **less than the max output tokens** of the request, and it must
stay inside `ModelMetadata.thinkingBudgets` (or `[1024, 32768]` when it is absent). `-1` means the
dynamic budget, and it is accepted by Google AI only.

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
bun run build:all  # CJS + ESM
bun run lint
```
