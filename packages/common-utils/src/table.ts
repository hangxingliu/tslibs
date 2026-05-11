/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { ANSI_REGEXP_ALL } from "./strings/shell-ansi-regex.js";

export enum TableRowType {
  header = 0,
  boundary = 1,
  body = 2,
}

export type TableRowStringify<State> = (type: TableRowType, columns: string[], state?: State) => string;

export type TablePrinterOptions<State> = {
  cols?: number;
  boundary?: string;
  stringify?: TableRowStringify<State>;
  ansiEscape?: boolean;
  len?: (str: string) => number;
};

export type ColorizedTableRowState = { color: string };

/**
 * string[]: multi-line mode
 */
export type TableCellType = number | string | boolean | null | undefined | ReadonlyArray<string>;

export class TablePrinter<State = any> {
  static readonly RowType = TableRowType;

  static readonly DEFAULT_STRINGIFY: TableRowStringify<any> = (type, cols) =>
    cols.join(type === TableRowType.boundary ? "---" : "   ");

  static readonly COLORIZED_STRINGIFY: TableRowStringify<ColorizedTableRowState> = (type, cols, state) => {
    const row = cols.join(type === TableRowType.boundary ? "---" : "   ");
    if (state && state.color) return state.color + row + "\x1b[0m";
    return row;
  };

  //#region state
  private rows: string[][] = [];
  private states: (State | undefined)[] = [];
  private colWidths: number[] = [];
  get length() {
    return this.rows.length;
  }
  //#endregion state

  //#region config
  private readonly align: Array<string | undefined> = [];
  private readonly headers: string[];
  private readonly noHeader: boolean;
  private readonly numOfCols: number;
  private readonly boundary: string;
  private readonly stringify: TableRowStringify<State>;
  private readonly lenFn: (str: string) => number;
  //#endregion config

  constructor(header: string[], opts?: TablePrinterOptions<State>) {
    let numOfCols = header.length;
    let ansiEscape = true;
    let boundary = "-";
    let stringify = TablePrinter.DEFAULT_STRINGIFY;

    this.headers = header;
    this.noHeader = this.headers.length === 0;

    if (opts) {
      if (typeof opts.cols === "number") {
        numOfCols = opts.cols;
        if (this.headers.length < numOfCols) {
          for (let i = this.headers.length; i < numOfCols; i++) this.headers[i] = "";
        } else {
          this.headers.length = numOfCols;
        }
      }
      if (typeof opts.ansiEscape === "boolean") ansiEscape = opts.ansiEscape;
      if (typeof opts.stringify === "function") stringify = opts.stringify;
      if (typeof opts.boundary === "string") boundary = opts.boundary;
    }

    this.boundary = boundary;
    this.numOfCols = numOfCols;
    this.stringify = stringify;
    this.lenFn = opts?.len || (ansiEscape ? lenWithANSIEscape : len);
    this.resetState();
  }

  resetState() {
    this.rows = [];
    this.states = [];
    this.colWidths = this.headers.map(this.lenFn);
  }

  setAlign(at: string | number, align?: string) {
    if (typeof at === "string") {
      const lc = at.toLowerCase();
      const index = this.headers.findIndex((it) => it.toLowerCase() === lc);
      if (index < 0) return false;
      at = index;
    }
    this.align[at] = align;
  }

  addRows(rows: TableCellType[][], states: State[] = []) {
    rows.forEach((row, i) => this.addRow(row, states[i]));
  }

  _addRow(row: string[], state?: State) {
    const cols: string[] = [];
    this.rows.push(cols);
    this.states.push(state);
    for (let i = 0; i < this.numOfCols; i++) {
      const str = row[i] || "";
      const width = this.lenFn(str);
      cols.push(str);
      if (width > this.colWidths[i]) this.colWidths[i] = width;
    }
  }

  addRow(row: TableCellType[], state?: State) {
    if (row.some((it) => Array.isArray(it))) {
      // multi-line mode
      let maxLine = 1;
      const allLines: string[][] = [];
      for (const col of row) {
        let lines: string[];
        if (Array.isArray(col)) {
          lines = col;
        } else {
          if (col === null || col === undefined) lines = [""];
          else lines = [String(col)];
        }
        if (lines.length > maxLine) maxLine = lines.length;
        allLines.push(lines);
      }
      for (let i = 0; i < maxLine; i++) {
        const cols: string[] = [];
        for (const lines of allLines) cols.push(lines[i] || "");
        this._addRow(cols, state);
      }
      return;
    }
    const strs = row.map((it) => {
      if (it === null || it === undefined) return "";
      return String(it);
    });
    return this._addRow(strs, state);
  }

  private padEnd(str: string, len: number) {
    const currLen = this.lenFn(str);
    if (currLen >= len) return str;
    return str + "".padEnd(len - currLen);
  }

  private prePrint() {
    const noHeader = this.noHeader;
    for (let i = 0; i < this.numOfCols; i++) {
      const len = this.colWidths[i];
      if (!noHeader) this.headers[i] = this.padEnd(this.headers[i], len);
      for (let j = 0; j < this.rows.length; j++) this.rows[j][i] = this.padEnd(this.rows[j][i], len);
    }
  }

  private getBoundaryRow() {
    return this.colWidths.map((len) => "".padEnd(len, this.boundary));
  }

  print() {
    const noHeader = this.noHeader;
    this.prePrint();
    if (!noHeader) {
      console.log(this.stringify(TableRowType.header, this.headers));
      console.log(this.stringify(TableRowType.boundary, this.getBoundaryRow()));
    }
    for (let i = 0; i < this.rows.length; i++)
      console.log(this.stringify(TableRowType.body, this.rows[i], this.states[i]));
    this.resetState();
  }

  toString() {
    const lines: string[] = [];
    const noHeader = this.noHeader;
    this.prePrint();
    if (!noHeader) {
      lines.push(this.stringify(TableRowType.header, this.headers));
      lines.push(this.stringify(TableRowType.boundary, this.getBoundaryRow()));
    }
    for (let i = 0; i < this.rows.length; i++)
      lines.push(this.stringify(TableRowType.body, this.rows[i], this.states[i]));
    this.resetState();
    return lines;
  }
}

function lenWithANSIEscape(str: string) {
  return str.replace(ANSI_REGEXP_ALL, "").length;
}
function len(str: string) {
  return str.length;
}
