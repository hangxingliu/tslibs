import type { ModelMetadata } from "./types.js";

/**
 * Mapping to the `output_config.effort` parameter of the Claude API.
 * @see https://platform.claude.com/docs/en/build-with-claude/effort
 *
 * The API levels are `low`, `medium`, `high`, `xhigh` and `max`. There is no wellknown level for
 * `xhigh`: `max` is mapped to the highest API level (`max`), and `minimal` is mapped to `low`.
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

/** The Claude API writes the effort level to `output_config.effort` */
export const ANTHROPIC_EFFORT_PROP = "output_config.effort";
