/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";
import { formatDate } from "./zero-deps/format-date.js";
import { JSONStreamWriter } from "./json-stream-writer.js";

/**
 * Write debug data into `/path/to/dir/category/yyyymmdd-HHMMSS.json`
 */
export class DebugDataWriter {
  private readonly initedCategories = new Set<string>();
  /** key: category name */
  private lastTimestamp = new Map<string, { ts: number; suffix: number }>();

  private dataDir: string | undefined;
  private dataDirGetter: (() => string) | undefined;
  constructor(dataDir: string | (() => string)) {
    if (typeof dataDir === "string") this.dataDir = dataDir;
    else this.dataDirGetter = dataDir;
  }

  private initDir(category: string) {
    if (typeof this.dataDir !== "string") this.dataDir = this.dataDirGetter!();
    const dir = resolve(this.dataDir, category);
    if (this.initedCategories.has(category)) return dir;

    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    this.initedCategories.has(category);
    return dir;
  }

  private init(_category: string, dateUnit?: "year" | "month" | "day" | "hour" | "minute") {
    const category = basename(_category).replace(/^\.+$/, "");
    if (!category) throw new Error(`Invalid category name "${_category}"`);

    const dataDir = this.initDir(category);

    let suffix: number | undefined;
    const now = new Date();
    const prev = this.lastTimestamp.get(category);
    const nowUnix = Math.floor(now.getTime() / 1000);
    if (prev && nowUnix === prev.ts) {
      suffix = ++prev.suffix;
    } else {
      this.lastTimestamp.set(category, { ts: nowUnix, suffix: 0 });
    }

    let format: string;
    if (dateUnit === "year") format = "yyyy";
    else if (dateUnit === "month") format = "yyyymm";
    else if (dateUnit === "day") format = "yyyymmdd";
    else if (dateUnit === "hour") format = "yyyymmdd-HH";
    else if (dateUnit === "minute") format = "yyyymmdd-HHMM";
    else format = "yyyymmdd-HHMMSS";
    const fileName = formatDate(format, now) + (typeof suffix === "number" ? `-${suffix}` : "") + ".json";
    const filePath = resolve(dataDir, fileName);
    const relativePath = relative(process.cwd(), filePath);
    return { category, fileName, filePath, relativePath };
  }

  /**
   * @param category For example: 'list-users'
   */
  write<T>(_category: string, data: T, printLog = true): { data: T; filePath: string } | undefined {
    let relativePath = "";
    try {
      const r = this.init(_category);
      relativePath = r.relativePath;
      writeFileSync(r.filePath, JSON.stringify(data));
      if (printLog) process.stderr.write(`debug: dump to "${relativePath}"\n`);
      return { data, filePath: r.filePath };
    } catch (error) {
      console.error(`error: failed to write data file "${relativePath}"`, error);
    }
  }

  createJsonStream(_category: string, printLog = true) {
    let relativePath = "";
    try {
      const r = this.init(_category);
      relativePath = r.relativePath;
      const stream = new JSONStreamWriter(r.filePath);
      if (printLog) process.stderr.write(`debug: streaming to "${relativePath}" ...\n`);
      return { stream, filePath: r.filePath };
    } catch (error) {
      console.error(`Failed to create a write stream of data file "${relativePath}"`, error);
      throw error;
    }
  }

  async createAppendableJsonStream(
    _category: string,
    dateUnitForAppend: "year" | "month" | "day" | "hour" | "minute",
    printLog = true
  ) {
    let relativePath = "";
    try {
      const r = this.init(_category, dateUnitForAppend);
      relativePath = r.relativePath;
      const stream = await JSONStreamWriter.append(r.filePath);
      if (printLog) process.stderr.write(`debug: streaming to "${relativePath}" ...\n`);
      return { stream, filePath: r.filePath };
    } catch (error) {
      console.error(`Failed to create a appendable stream of data file "${relativePath}"`, error);
      throw error;
    }
  }
}
