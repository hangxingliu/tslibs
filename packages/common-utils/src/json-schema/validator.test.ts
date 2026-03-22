import type { JSONSchema } from "./schema-types.js";
import { validateSchema } from "./validator.js";

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
async function main() {
  const schema = {
    type: "object",
    properties: {
      name: { type: "string" },
      level: { type: "integer" },
    },
    required: ["name"],
  } satisfies JSONSchema;

  await validateSchema({}, schema);
}
