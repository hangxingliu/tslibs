import { expect, test, describe, mock } from "bun:test";
import { NodeEventEmitter } from "./nodejs.js";

interface TestEvents {
  error: [error: Error];
  warn: [message: string, error?: Error];
  info: [message: string];
}

class TestEmitter extends NodeEventEmitter<TestEvents> {
  async fetch() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.emit("error", new Error("Test error"));
        resolve();
      }, 10);
    });
  }

  fetch2 = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.emit("warn", "WARNING", new Error("Test warning"));
        resolve();
      }, 10);
    });
  };
}

describe("NodeEventEmitter", () => {
  test("should emit 'error' event and handle on/once", async () => {
    const emitter = new TestEmitter();
    const handleError = mock((err: Error) => {});
    const handleOnceError = mock((err: Error) => {});

    emitter.on("error", handleError);
    emitter.once("error", handleOnceError);

    await emitter.fetch();

    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError.mock.calls[0][0].message).toBe("Test error");
    expect(handleOnceError).toHaveBeenCalledTimes(1);

    // Second call should only trigger 'on', not 'once'
    await emitter.fetch();
    expect(handleError).toHaveBeenCalledTimes(2);
    expect(handleOnceError).toHaveBeenCalledTimes(1);
  });

  test("should emit 'warn' event with multiple arguments", async () => {
    const emitter = new TestEmitter();
    const handleWarn = mock((msg: string, err?: Error) => {});

    emitter.on("warn", handleWarn);

    await emitter.fetch2();

    expect(handleWarn).toHaveBeenCalledTimes(1);
    expect(handleWarn.mock.calls[0][0]).toBe("WARNING");
    expect(handleWarn.mock.calls[0][1]).toBeInstanceOf(Error);
    expect(handleWarn.mock.calls[0][1]?.message).toBe("Test warning");
  });

  test("should remove listeners using off", () => {
    const emitter = new TestEmitter();
    const handleInfo = mock(() => {});

    emitter.on("info", handleInfo);
    emitter.off("info", handleInfo);

    emitter.emit("info", "test");

    expect(handleInfo).not.toHaveBeenCalled();
  });
});
