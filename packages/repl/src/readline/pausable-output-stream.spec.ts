import { strictEqual, ok } from "node:assert";
import { Writable } from "node:stream";
import { createFakeTTY } from "./__tests__/fake-tty.js";
import { PausableOutputStream } from "./pausable-output-stream.js";

describe("PausableOutputStream", () => {
  it("forwards dimensions and resize and detaches without closing the target", () => {
    const tty = createFakeTTY();
    const output = new PausableOutputStream(tty.output);
    let resized = 0;
    output.on("resize", () => {
      resized++;
    });
    tty.output.columns = 100;
    tty.output.emit("resize");
    strictEqual(output.columns, 100);
    strictEqual(output.rows, 24);
    strictEqual(output.isTTY, true);
    strictEqual(resized, 1);
    output.dispose();
    tty.output.emit("resize");
    strictEqual(resized, 1);
    strictEqual(tty.output.destroyed, false);
  });

  it("drops secrets at admission even when the target is backpressured", async () => {
    let text = "";
    let release!: () => void;
    const target = new Writable({
      write(chunk, _encoding, callback) {
        text += chunk.toString();
        release = callback;
      },
    });
    const output = new PausableOutputStream(target);
    output.write("prompt");
    output.paused = true;
    output.write("secret");
    output.paused = false;
    release();
    await new Promise<void>((resolve) => setImmediate(resolve));
    strictEqual(text, "prompt");
    ok(!text.includes("secret"));
    output.dispose();
  });
});
