/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { Writable } from "node:stream";
import type { TerminalWritableStream } from "./types.js";

/**
 * Masks readline output without affecting command output on the original stream.
 * Readline writes into this proxy, while commands keep writing to the original stream directly.
 * It also forwards TTY dimensions and `resize` events so readline can handle line wrapping.
 */
export class PausableOutputStream extends Writable {
  /**
   * When `true`, chunks are dropped as soon as they enter `write()` rather than when the buffer drains,
   * so password characters already queued under backpressure can never leak to the terminal.
   */
  paused = false;
  private readonly onResize = () => this.emit("resize");

  constructor(private readonly target: TerminalWritableStream) {
    super();
    target.on("resize", this.onResize);
  }

  get columns() {
    return this.target.columns;
  }

  get rows() {
    return this.target.rows;
  }

  get isTTY() {
    return this.target.isTTY;
  }

  override write(chunk: string | Uint8Array, callback?: (error?: Error | null) => void): boolean;
  override write(
    chunk: string | Uint8Array,
    encoding: BufferEncoding,
    callback?: (error?: Error | null) => void
  ): boolean;
  override write(
    chunk: string | Uint8Array,
    encoding?: BufferEncoding | ((error?: Error | null) => void),
    callback?: (error?: Error | null) => void
  ): boolean {
    if (this.paused) {
      const done = typeof encoding === "function" ? encoding : callback;
      if (done) queueMicrotask(() => done());
      return true;
    }
    return typeof encoding === "string"
      ? super.write(chunk, encoding, callback)
      : super.write(chunk, typeof encoding === "function" ? encoding : callback);
  }

  override _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    this.target.write(chunk, callback);
  }

  /** Detaches from the target stream. The target stream itself is caller-owned and is not closed. */
  dispose() {
    this.target.off("resize", this.onResize);
  }
}
