import { expect, test, describe } from "bun:test";
import { parseUnixEscapeSeq, escapeShellArg, escapeShellArgs } from "./shell-args-escape.js";

describe("shell-args-escape", () => {
  describe("escapeShellArg", () => {
    test("should not escape simple alphanumeric strings", () => {
      expect(escapeShellArg("hello")).toBe("hello");
      expect(escapeShellArg("file-1.2_3")).toBe("file-1.2_3");
    });

    test("should escape strings with spaces", () => {
      expect(escapeShellArg("hello world")).toBe("'hello world'");
    });

    test("should escape strings with single quotes", () => {
      expect(escapeShellArg("it's ok")).toBe("'it'\\''s ok'");
    });

    test("should escape strings with other special characters", () => {
      expect(escapeShellArg("foo$bar")).toBe("'foo$bar'");
      expect(escapeShellArg("foo*bar")).toBe("'foo*bar'");
      expect(escapeShellArg("foo(bar)")).toBe("'foo(bar)'");
    });
  });

  describe("escapeShellArgs", () => {
    test("should escape and join multiple arguments", () => {
      expect(escapeShellArgs(["ls", "-l", "my file.txt"])).toBe("ls -l 'my file.txt'");
    });
  });

  describe("parseUnixEscapeSeq", () => {
    test("should parse standard escape sequences", () => {
      expect(parseUnixEscapeSeq("\\n")).toEqual(Buffer.from("\n"));
      expect(parseUnixEscapeSeq("\\t")).toEqual(Buffer.from("\t"));
      expect(parseUnixEscapeSeq("\\\\")).toEqual(Buffer.from("\\"));
      expect(parseUnixEscapeSeq("\\r\\n")).toEqual(Buffer.from("\r\n"));
    });

    test("should parse hexadecimal escape sequences", () => {
      // "你好" in UTF-8 hex: e4 bd a0 e5 a5 bd
      const hexSeq = "\\xe4\\xbd\\xa0\\xe5\\xa5\\xbd";
      expect(parseUnixEscapeSeq(hexSeq).toString("utf-8")).toBe("你好");

      expect(parseUnixEscapeSeq("\\x41")).toEqual(Buffer.from("A"));
    });

    test("should parse octal escape sequences", () => {
      expect(parseUnixEscapeSeq("\\101")).toEqual(Buffer.from("A"));
      expect(parseUnixEscapeSeq("\\012")).toEqual(Buffer.from("\n"));
    });

    test("should handle mixed literal and escape sequences", () => {
      expect(parseUnixEscapeSeq("A\\nB").toString()).toBe("A\nB");
    });

    test("should handle invalid escape sequences gracefully", () => {
      // If \x is not followed by hex, it might be treated as literal or partially parsed depending on implementation
      // Current implementation: if \x is not followed by hex, it stays as is or ignores \
      expect(parseUnixEscapeSeq("\\xZZ").toString()).toBe("xZZ");
    });
  });
});
