import { PassThrough, Writable } from "node:stream";
import { TerminalWritableStream } from "../types.js";

/**
 * Creates an in-memory input/output pair that mimics a TTY for readline tests.
 * Pass `terminal: false` to simulate piped (non-TTY) output.
 * @example
 * const tty = createFakeTTY({ columns: 20 });
 * await tty.type("help\r"); // waits one macrotask so readline can process the input
 * assert.ok(tty.getOutput().includes("help"));
 */
export function createFakeTTY(options: { columns?: number; rows?: number; terminal?: boolean } = {}) {
  let text = "";

  const input = new PassThrough();
  const output = Object.assign(
    new Writable({
      write(chunk, _encoding, callback) {
        text += chunk.toString();
        callback();
      },
    }),
    { columns: options.columns ?? 80, rows: options.rows ?? 24, isTTY: options.terminal ?? true }
  );

  return {
    input,
    output,
    getOutput: () => text,
    clearOutput: () => {
      text = "";
    },
    async type(value: string) {
      input.write(value);
      await new Promise<void>((resolve) => setImmediate(resolve));
    },
  };
}
