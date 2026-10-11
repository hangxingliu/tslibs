import { ok } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Allowed internal layering of this package (unit tests and `__tests__` helpers are excluded):
 *
 * 1. `tokenizer/` is standalone: it may only import itself and `contrib/`.
 * 2. `complete/` may additionally import `tokenizer/`.
 * 3. `readline/` may additionally import `complete/`.
 *
 * `tokenizer/` and `complete/` must also never import `node:readline`, so they can be reused by
 * non-Node line editors (e.g. a future web line editor).
 *
 * The current code satisfies all of these rules. If that ever stops being true, document the
 * violation here and mark the related test with `.skip` until it is fixed.
 */
const LAYERS: ReadonlyArray<{ dir: string; allowedDirs: readonly string[]; forbidNodeReadline: boolean }> = [
  { dir: "tokenizer", allowedDirs: ["tokenizer", "contrib"], forbidNodeReadline: true },
  { dir: "complete", allowedDirs: ["complete", "tokenizer", "contrib"], forbidNodeReadline: true },
  { dir: "readline", allowedDirs: ["readline", "complete", "contrib"], forbidNodeReadline: false },
];

const SRC_DIR_PATH = fileURLToPath(new URL(".", import.meta.url));
/** Matches `from "x"`, side-effect `import "x"`, dynamic `import("x")` and `require("x")`. */
const REGEXP_IMPORT = /\b(?:from|import|require)\s*\(?\s*["']([^"']+)["']/g;
const REGEXP_NODE_READLINE = /^(node:)?readline(\/|$)/;

function listSourceFiles(dirPath: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name !== "__tests__") result.push(...listSourceFiles(join(dirPath, entry.name)));
    } else if (/\.[jt]s$/.test(entry.name) && !/\.(spec|d)\.[jt]s$/.test(entry.name)) {
      result.push(join(dirPath, entry.name));
    }
  }
  return result;
}

/** @returns the top-level directory under `src/` (or the file name for root files) */
function getTopLevelEntry(absPath: string): string {
  return relative(SRC_DIR_PATH, absPath).split(/[\\/]/)[0];
}

describe("internal module dependencies", () => {
  for (const layer of LAYERS) {
    it(`${layer.dir}/ only depends on: ${layer.allowedDirs.join(", ")}`, () => {
      const filePaths = listSourceFiles(join(SRC_DIR_PATH, layer.dir));
      ok(filePaths.length > 0);
      for (const filePath of filePaths) {
        const fileRelativePath = relative(SRC_DIR_PATH, filePath);
        const code = readFileSync(filePath, "utf8");
        for (const match of code.matchAll(REGEXP_IMPORT)) {
          const specifier = match[1];
          if (specifier.startsWith(".")) {
            const target = getTopLevelEntry(resolve(dirname(filePath), specifier));
            ok(layer.allowedDirs.includes(target), `${fileRelativePath} must not import "${specifier}"`);
          } else if (layer.forbidNodeReadline) {
            ok(!REGEXP_NODE_READLINE.test(specifier), `${fileRelativePath} must not import "${specifier}"`);
          }
        }
      }
    });
  }
});
