/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
//
import type { HistoryFileError, LoadHistoryFileOptions } from "./types.js";

export const DEFAULT_HISTORY_LIMIT = 1000;

/** @throws {RangeError} when `limit` is not a positive safe integer */
export function validateHistoryLimit(limit: number): number {
  if (!Number.isSafeInteger(limit) || limit <= 0) throw new RangeError("History limit must be a positive safe integer");
  return limit;
}

/**
 * Blank lines and lines starting with a space are excluded from history,
 * so users can prefix a command with a space to keep secrets out of the history file.
 * @example shouldRecordHistory("ls -l") // => true
 * @example shouldRecordHistory(" login --token abc") // => false
 */
export function shouldRecordHistory(line: string) {
  return line.trim() !== "" && !line.startsWith(" ");
}

/**
 * Loads entries oldest-first and truncates an oversized file to the most recent `options.limit` entries.
 * A missing file is not an error. Other failures are reported via `options.onError` and never thrown.
 * @returns history entries ordered oldest-first, or an empty array if the file cannot be read
 */
export function loadHistoryFile(filePath: string, options: Readonly<LoadHistoryFileOptions>): string[] {
  validateHistoryLimit(options.limit);
  let lines: string[];
  try {
    lines = readFileSync(filePath, "utf8").split("\n").filter(shouldRecordHistory);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      options.onError({ operation: "read", filePath, error });
    return [];
  }
  const entries = lines.slice(-options.limit);
  if (lines.length > entries.length) {
    try {
      writeFileSync(filePath, entries.join("\n") + "\n", { mode: 0o600 });
    } catch (error) {
      options.onError({ operation: "truncate", filePath, error });
    }
  }
  return entries;
}

/**
 * Appends accepted command lines to the history file synchronously.
 * The file is not capped on append; it is truncated by {@link loadHistoryFile} on the next startup.
 */
export class HistoryFileWriter {
  /**
   * @param lastSaved the newest entry already in the file, used to skip consecutive duplicates
   */
  constructor(
    private readonly filePath: string,
    private readonly onError: (failure: HistoryFileError) => void,
    private lastSaved?: string
  ) {}

  append(line: string): void {
    if (!shouldRecordHistory(line) || line === this.lastSaved) return;
    try {
      appendFileSync(this.filePath, `${line}\n`, { mode: 0o600 });
      this.lastSaved = line;
    } catch (error) {
      this.onError({ operation: "append", filePath: this.filePath, error });
    }
  }
}
