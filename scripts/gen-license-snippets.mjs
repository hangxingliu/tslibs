#!/usr/bin/env node
//@ts-check

import { glob, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const BANNER_DIR = resolve(import.meta.dirname, "licenses");
const TARGET_FILE = resolve(PROJECT_ROOT, ".vscode/license.code-snippets");
const BANNER_GLOB = "*.banner.js";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const bannerFileNames = [];
  for await (const entry of glob(BANNER_GLOB, { cwd: BANNER_DIR, withFileTypes: true })) {
    if (entry.isFile()) bannerFileNames.push(entry.name);
  }

  bannerFileNames.sort();
  if (!bannerFileNames.length) throw new Error(`No license banners found in "${BANNER_DIR}".`);

  /** @type {Record<string, { scope: string, prefix: string, body: string[], description: string }>} */
  const snippets = Object.create(null);

  for (const fileName of bannerFileNames) {
    const license = fileName.slice(0, -".banner.js".length);
    const banner = await readFile(resolve(BANNER_DIR, fileName), "utf8");
    snippets[`${license.toUpperCase()} License Banner`] = {
      scope: "javascript,javascriptreact,typescript,typescriptreact",
      prefix: `banner-${license}`,
      body: banner
        .replace(/\r\n?/g, "\n")
        .replace(/\n$/, "")
        .split("\n")
        // Escape snippet metacharacters so the inserted banner remains literal text.
        .map((line) => line.replace(/[\\$}]/g, "\\$&")),
      description: `Insert the ${license.toUpperCase()} license banner`,
    };
  }

  await mkdir(dirname(TARGET_FILE), { recursive: true });
  await writeFile(TARGET_FILE, `${JSON.stringify(snippets, null, 2)}\n`, "utf8");
  console.log(`Generated ${bannerFileNames.length} license snippet(s) in "${TARGET_FILE}".`);
}
