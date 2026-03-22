import { Usage } from "./usage.js";
import { filterModelMetadata } from "./model-metadata/utils.js";
import { ALL_MODELS } from "./model-metadata/index.js";

{
  const usage = {
    input_tokens: 25,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation: {
      ephemeral_5m_input_tokens: 0,
      ephemeral_1h_input_tokens: 0,
    },
    output_tokens: 1133,
    service_tier: "standard",
  };
  const parsed = Usage.fromAnthropic(usage);
  const model = filterModelMetadata("claude-3-7-sonnet", ALL_MODELS);

  console.log(parsed);
  console.log(Usage.getCost(parsed, model[0]));
}
