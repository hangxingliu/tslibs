import { readFileSync } from "fs";
import { resolve } from "path";
import { parseEnvFile } from "./env-file-parser.js";

const exampleFile = resolve(import.meta.dirname, "../../assets/env.sh");
const exampleConfig = readFileSync(exampleFile, "utf-8");
console.log(Array.from(parseEnvFile(exampleConfig).entries()));

const exampleConfig2 = "\nTEST=${XXX}:users/${USER};\n";
console.log(Array.from(parseEnvFile(exampleConfig2).entries()));
