import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Packages in this repo set `"type": "module"` and still emit CommonJS into `cjs/*.js`.
// Node treats `.js` as ESM in that case, so `require()` cannot load the CommonJS build.
// A nested package.json marks the emitted directory as CommonJS. Run this after `tsc`.
const directory = resolve(process.cwd(), "cjs");
writeFileSync(resolve(directory, "package.json"), '{ "type": "commonjs" }\n');
