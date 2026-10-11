import { tmpdir } from "node:os";
import { join } from "node:path";
import { deepStrictEqual, strictEqual, throws } from "node:assert";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
//
import { HistoryFileWriter, loadHistoryFile } from "./history-file.js";
//
import type { HistoryFileError } from "./types.js";

describe("history files", () => {
  let dir: string;
  let filePath: string;
  let failures: HistoryFileError[];
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "repl-history-"));
    filePath = join(dir, "history");
    failures = [];
  });
  afterEach(() => {
    rmSync(dir, { recursive: true });
  });
  const options = () => ({ limit: 2, onError: (failure: HistoryFileError) => failures.push(failure) });

  it("handles missing files and validates limits", () => {
    deepStrictEqual(loadHistoryFile(filePath, options()), []);
    deepStrictEqual(failures, []);
    throws(() => loadHistoryFile(filePath, { ...options(), limit: 0 }), RangeError);
    throws(() => loadHistoryFile(filePath, { ...options(), limit: 1.5 }), RangeError);
  });

  it("loads recent entries and truncates oversized files", () => {
    writeFileSync(filePath, "one\n\n secret\ntwo\nthree\n");
    deepStrictEqual(loadHistoryFile(filePath, options()), ["two", "three"]);
    strictEqual(readFileSync(filePath, "utf8"), "two\nthree\n");
  });

  it("appends private files, filters entries and deduplicates across restarts", () => {
    const writer = new HistoryFileWriter(filePath, options().onError);
    for (const line of ["", " ", " secret", "one", "one", "two", "one"]) writer.append(line);
    strictEqual(readFileSync(filePath, "utf8"), "one\ntwo\none\n");
    strictEqual(statSync(filePath).mode & 0o777, 0o600);
    const restored = new HistoryFileWriter(filePath, options().onError, "one");
    restored.append("one");
    strictEqual(readFileSync(filePath, "utf8"), "one\ntwo\none\n");
  });

  it("reports read and append errors without throwing", () => {
    deepStrictEqual(loadHistoryFile(dir, options()), []);
    new HistoryFileWriter(dir, options().onError).append("test");
    deepStrictEqual(
      failures.map((failure) => failure.operation),
      ["read", "append"]
    );
    strictEqual(failures[0].filePath, dir);
  });
});
