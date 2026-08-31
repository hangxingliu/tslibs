import type { ModelMetadata } from "./types.js";

/**
 * Mapping to the `effort` parameter of the Claude API.
 * @see https://platform.claude.com/docs/en/build-with-claude/effort
 *
 * The `xhigh` effort level is unreachable here because the wellknown level `max` is already
 * mapped to the highest effort level (`max`) supported by these models.
 */
export const ANTHROPIC_EFFORT_LEVELS = {
  minimal: "low",
  low: "low",
  medium: "medium",
  high: "high",
  max: "max",
} satisfies ModelMetadata["thinkingLevels"];

/** For the models that support the `effort` parameter but not its `max` level */
export const ANTHROPIC_EFFORT_LEVELS_WITHOUT_MAX = {
  ...ANTHROPIC_EFFORT_LEVELS,
  max: "high",
} satisfies ModelMetadata["thinkingLevels"];

/** In the Claude API, the effort level is a top-level field instead of the OpenAI style `reasoning_effort` */
export const ANTHROPIC_EFFORT_PROP = "effort";
