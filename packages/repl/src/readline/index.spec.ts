import { describe, it, beforeEach, afterEach } from "bun:test";
import { deepStrictEqual, match, rejects, strictEqual, ok } from "node:assert";
//
import { createFakeTTY } from "./__tests__/fake-tty.js";
//
import { LineReader } from "./index.js";
//
import { REPLInputCancelledError } from "./types.js";

describe("LineReader", () => {
  let tty: ReturnType<typeof createFakeTTY>;
  let reader: LineReader;
  beforeEach(() => {
    tty = createFakeTTY();
    reader = new LineReader(tty);
  });
  afterEach(() => {
    reader.close();
  });

  it("reads one line and queues all lines from the same chunk", async () => {
    const first = reader.readLine("$ ");
    await tty.type("one\rtwo\rthree\r");
    strictEqual(await first, "one");
    reader.leaveBusy();
    strictEqual(await reader.readLine("$ "), "two");
    reader.leaveBusy();
    strictEqual(await reader.readLine("$ "), "three");
    reader.leaveBusy();
    const pending = reader.readLine("$ ");
    reader.close();
    strictEqual(await pending, null);
  });

  it("clears typed input on Ctrl+C and closes on two empty interrupts", async () => {
    const pending = reader.readLine("$ ");
    await tty.type("abc\x03");
    strictEqual(reader.rl.line, "");
    await tty.type("\x03");
    match(tty.getOutput(), /To exit/);
    await tty.type("\x03");
    strictEqual(await pending, null);
  });

  it("disarms the exit hint when another key is pressed", async () => {
    const pending = reader.readLine("$ ");
    await tty.type("\x03abc\x15\x03");
    strictEqual(reader.rl.line, "");
    await tty.type("accepted\r");
    strictEqual(await pending, "accepted");
  });

  it("preserves line and cursor across asynchronous output and status refresh", async () => {
    void reader.readLine("STATUS\n$ ");
    await tty.type("abcd\x1b[D\x1b[D");
    tty.clearOutput();
    reader.printAbove(() => tty.output.write("message\n"));
    await tty.type("");
    strictEqual(reader.rl.line, "abcd");
    strictEqual(reader.rl.cursor, 2);
    const output = tty.getOutput();
    ok(output.indexOf("message") < output.indexOf("STATUS"));
    ok(output.includes("\x1b[1A"));
    reader.refreshPrompt("UPDATED\n$ ");
    await tty.type("");
    strictEqual(reader.rl.line, "abcd");
    strictEqual(reader.rl.cursor, 2);
    match(tty.getOutput(), /UPDATED/);
  });

  it("lets readline count wide wrapped status and multiline input rows", async () => {
    reader.close();
    tty = createFakeTTY({ columns: 10 });
    reader = new LineReader(tty);
    void reader.readLine("1234567890123456789012345\n$ ");
    await tty.type("abcdefghijklmnop\x1b[D");
    ok(reader.rl.getCursorPos().rows >= 4);
    tty.clearOutput();
    reader.printAbove(() => tty.output.write("log\n"));
    ok(tty.getOutput().includes("\x1b[4A"));
    strictEqual(reader.rl.line, "abcdefghijklmnop");
    strictEqual(reader.rl.cursor, 15);
  });

  it("echoes busy type-ahead, disables completion and restores partial input", async () => {
    let completed = false;
    reader.close();
    reader = new LineReader({
      ...tty,
      completer: async () => {
        completed = true;
        return [["value"], ""];
      },
    });
    const pending = reader.readLine("$ ");
    await tty.type("run\r");
    strictEqual(await pending, "run");
    tty.clearOutput();
    await tty.type("abc\x1b[D\t");
    match(tty.getOutput(), /abc/);
    strictEqual(completed, false);
    strictEqual(reader.rl.line, "abc");
    strictEqual(reader.rl.cursor, 2);
    reader.printAbove(() => tty.output.write("busy log\n"));
    reader.leaveBusy();
    void reader.readLine("$ ");
    await tty.type("");
    strictEqual(reader.rl.line, "abc");
    strictEqual(reader.rl.cursor, 2);
    match(tty.getOutput(), /\$ /);
  });

  it("isolates question input from queued commands, partial input and history", async () => {
    reader.enterBusy();
    reader.recordCommand("old");
    await tty.type("queued\rpart\x1b[D");
    const answer = reader.inputLine({ prompt: "Name: " });
    await tty.type("username\r");
    strictEqual(await answer, "username");
    strictEqual(reader.rl.line, "part");
    strictEqual(reader.rl.cursor, 3);
    deepStrictEqual(reader.rl.history, ["old"]);
    reader.leaveBusy();
    strictEqual(await reader.readLine("$ "), "queued");
    strictEqual(reader.rl.line, "part");
  });

  it("dispatches question completion and rejects overlapping or idle calls", async () => {
    await rejects(reader.inputLine(), /only be called while a command is running/);
    reader.enterBusy();
    const answer = reader.inputLine({
      prompt: "Name: ",
      completer: async () => ({ result: ["admin"], matched: "ad" }),
    });
    await rejects(reader.inputLine(), /only be called while a command is running/);
    await tty.type("ad\t");
    strictEqual(reader.rl.line, "admin");
    await tty.type("\r");
    strictEqual(await answer, "admin");
  });

  it("reports completion failures without closing the pending command read", async () => {
    reader.close();
    const errors: unknown[] = [];
    reader = new LineReader({
      ...tty,
      completer: async () => {
        throw new Error("completion failed");
      },
      onError: (error) => {
        errors.push(error);
      },
    });
    const pending = reader.readLine("$ ");
    await tty.type("x\t");
    strictEqual(errors.length, 1);
    await tty.type("\r");
    strictEqual(await pending, "x");
  });

  it("rejects pending reads on stream errors and detaches stream listeners", async () => {
    reader.close();
    const errors: unknown[] = [];
    reader = new LineReader({
      ...tty,
      onError: (error) => {
        errors.push(error);
      },
    });
    const pending = reader.readLine("$ ");
    const failure = rejects(pending, /input failed/);
    tty.input.emit("error", new Error("input failed"));
    await failure;
    strictEqual(errors.length, 1);
    strictEqual(tty.input.listenerCount("keypress"), 0);
    strictEqual(tty.output.listenerCount("resize"), 0);
  });

  it("does not reveal password characters during resize", async () => {
    reader.enterBusy();
    const answer = reader.inputLine({ prompt: "Password: ", password: true });
    await tty.type("secret");
    tty.output.columns = 5;
    tty.output.emit("resize");
    await tty.type("\r");
    strictEqual(await answer, "secret");
    strictEqual(tty.getOutput().includes("secret"), false);
  });

  it("supports password questions without terminal control sequences in pipes", async () => {
    reader.close();
    tty = createFakeTTY({ terminal: false });
    reader = new LineReader(tty);
    reader.enterBusy();
    const answer = reader.inputLine({ prompt: "Password: ", password: true });
    await tty.type("secret\n");
    strictEqual(await answer, "secret");
    strictEqual(tty.getOutput(), "Password: ");
    deepStrictEqual(reader.rl.history, []);
  });

  it("hides passwords, disables completion and never retains them in history", async () => {
    reader.enterBusy();
    let completed = false;
    const answer = reader.inputLine({
      prompt: "Password: ",
      password: true,
      completer: async () => {
        completed = true;
        return ["secret"];
      },
    });
    await tty.type("secret\t");
    reader.printAbove(() => tty.output.write("notification\n"));
    await tty.type("\r");
    strictEqual(await answer, "secret");
    strictEqual(tty.getOutput().includes("secret"), false);
    strictEqual(completed, false);
    deepStrictEqual(reader.rl.history, []);
  });

  it("cancels ordinary and password input on Ctrl+C and Ctrl+D", async () => {
    for (const password of [false, true]) {
      reader.enterBusy();
      const answer = reader.inputLine({ password });
      const cancelled = rejects(answer, REPLInputCancelledError);
      await tty.type("secret\x03");
      await cancelled;
      strictEqual(reader.rl.line, "");
    }
    const eof = reader.inputLine();
    const cancelled = rejects(eof, REPLInputCancelledError);
    await tty.type("\x04");
    await cancelled;
  });

  it("cancels nonempty ordinary and password input on Ctrl+D", async () => {
    for (const password of [false, true]) {
      reader.close();
      tty = createFakeTTY();
      reader = new LineReader(tty);
      reader.enterBusy();
      const answer = reader.inputLine({ password });
      const cancelled = rejects(answer, REPLInputCancelledError);
      await tty.type("secret\x04");
      await cancelled;
      deepStrictEqual(reader.rl.history, []);
      if (password) strictEqual(tty.getOutput().includes("secret"), false);
    }
  });

  it("only records accepted commands with matching in-memory filtering", async () => {
    reader.recordCommand("one");
    reader.recordCommand("one");
    reader.recordCommand(" secret");
    reader.recordCommand("");
    deepStrictEqual(reader.rl.history, ["one"]);
    reader.recordCommand("two");
    void reader.readLine("$ ");
    await tty.type("\x1b[A");
    strictEqual(reader.rl.line, "two");
  });

  it("drains non-TTY input after EOF and does not redraw asynchronous logs", async () => {
    reader.close();
    tty = createFakeTTY({ terminal: false });
    reader = new LineReader(tty);
    const pending = reader.readLine("$ ");
    tty.input.end("one\ntwo\nthree");
    strictEqual(await pending, "one");
    reader.leaveBusy();
    strictEqual(await reader.readLine("$ "), "two");
    reader.leaveBusy();
    strictEqual(await reader.readLine("$ "), "three");
    reader.leaveBusy();
    strictEqual(await reader.readLine("$ "), null);
    tty.clearOutput();
    reader.printAbove(() => tty.output.write("log\n"));
    strictEqual(tty.getOutput(), "log\n");
  });
});
