# `@hangxingliu/ai-model-metadata`

SDK-independent metadata of LLM models: prices, context limits and thinking capabilities.

The package is **ESM only**, has **zero runtime dependencies**, and does not depend on any AI SDK.
Adding or updating a model only requires a change in this package. `@hangxingliu/ai-utils` depends on
it for `ModelMetadata`, `calcTokenCost`, `filterModelMetadata`, `estimateTokensV1` and
`calcThinkingBudget`.

`require()` can load this package on Node.js 22.12 or newer. The package does not use top-level await.

## Layout

| Path | Responsibility |
| ---- | -------------- |
| `src/google.ts`, `src/xai.ts`, `src/anthropic.ts` | Active catalogs, newest model first. Archived catalogs sit beside them and are not re-exported from the package root |
| `src/all-models.ts` | `ALL_MODELS`, the concatenation of the active and archived catalogs |
| `src/types.ts` | `ModelMetadata` and the related price and thinking types |
| `src/utils.ts` | `filterModelMetadata` and `calcTokenCost` |
| `src/estimate-tokens.ts` | `estimateTokensV1`, a rough offline token estimate with no tokenizer download |
| `src/thinking-budget.ts` | `calcThinkingBudget`. The budget bounds and the max-output helper stay private |

## Prices

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

## Thinking budgets

`calcThinkingBudget` is used for models that accept a numeric thinking budget (Anthropic extended
thinking and Gemini 2). Models that accept a thinking level are configured by `@hangxingliu/ai-utils`
instead, and this function is not used for them.

The resolved budget must always be **less than the max output tokens** of the request, and it must
stay inside `ModelMetadata.thinkingBudgets` (or `[1024, 32768]` when it is absent). `-1` means the
dynamic budget, and it is accepted by Google AI only.

## Testing

```bash
# at the directory of this package
bun test src
bun run build      # ESM + type checking
bun run lint
```
