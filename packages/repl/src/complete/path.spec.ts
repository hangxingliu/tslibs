import { describe, it, beforeEach, afterEach } from "bun:test";
import { deepStrictEqual } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { completePath } from "./path.js";

describe("completePath", () => {
  let dirPath = "";
  beforeEach(() => {
    dirPath = mkdtempSync(join(tmpdir(), "repl-complete-path-"));
    mkdirSync(join(dirPath, "src", "components"), { recursive: true });
    mkdirSync(join(dirPath, "src", "config"));
    writeFileSync(join(dirPath, "src", "Constants.ts"), "");
    writeFileSync(join(dirPath, ".hidden"), "");
  });
  afterEach(() => rmSync(dirPath, { recursive: true, force: true }));

  it("completes the last path segment case-insensitively", () => {
    const { result, matched } = completePath("src/co", dirPath);
    deepStrictEqual(matched, "co");
    deepStrictEqual(result.sort(), ["Constants.ts", "components", "config"].sort());
  });

  it("supports dirOnly, dotFiles and non-recursive options", () => {
    deepStrictEqual(completePath("src/co", dirPath, { dirOnly: true, recursive: false }).result.sort(), [
      "components ",
      "config ",
    ]);
    deepStrictEqual(completePath(".h", dirPath, { dotFiles: false }).result, []);
    deepStrictEqual(completePath(".h", dirPath).result, [".hidden"]);
  });

  it("suggests the parent directory and ignores missing directories", () => {
    deepStrictEqual(completePath("..", dirPath).result[0], "..");
    deepStrictEqual(completePath("missing/x", dirPath), { result: [], matched: "x" });
  });
});
