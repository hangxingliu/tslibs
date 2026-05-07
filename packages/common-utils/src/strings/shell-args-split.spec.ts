import { expect, test, describe } from "bun:test";
import { splitShellArgs } from "./shell-args-split.js";

describe("splitShellArgs", () => {
  test("should handle empty string", () => {
    expect(splitShellArgs("")).toEqual([]);
  });

  test("should split simple commands", () => {
    expect(splitShellArgs("echo")).toEqual(["echo"]);
    expect(splitShellArgs("git ls-files")).toEqual(["git", "ls-files"]);
  });

  test("should handle escape characters outside quotes", () => {
    expect(splitShellArgs("\\ ")).toEqual([" "]);
    expect(splitShellArgs("\\")).toEqual(["\\"]);
    expect(splitShellArgs("\\'")).toEqual(["'"]);
    expect(splitShellArgs('\\"')).toEqual(['"']);
  });

  test("should handle double quotes", () => {
    expect(splitShellArgs('"git" ls-files')).toEqual(["git", "ls-files"]);
    expect(splitShellArgs('"quoted argument"')).toEqual(["quoted argument"]);
    expect(splitShellArgs('"double \\" quote"')).toEqual(['double " quote']);
  });

  test("should handle single quotes", () => {
    expect(splitShellArgs("'git' ls-files")).toEqual(["git", "ls-files"]);
    expect(splitShellArgs("'sp ace'")).toEqual(["sp ace"]);
    // Single quotes do not support backslash escaping in many shells,
    // and this implementation reflects that (it treats \ as a literal char inside single quotes).
    expect(splitShellArgs("'sp ace\\'")).toEqual(["sp ace\\"]);
  });

  test("should handle empty quotes", () => {
    expect(splitShellArgs("ls ''")).toEqual(["ls", ""]);
    expect(splitShellArgs('ls ""')).toEqual(["ls", ""]);
  });

  test("should handle complex mixed quoting", () => {
    const cmd = `echo "I'm Mike (\\"alias name\\")" 'quote"'`;
    expect(splitShellArgs(cmd)).toEqual(["echo", 'I\'m Mike ("alias name")', 'quote"']);
  });

  test("should handle incomplete escape sequences", () => {
    expect(splitShellArgs("arg\\")).toEqual(["arg\\"]);
  });

  test("should handle multiple spaces between arguments", () => {
    expect(splitShellArgs("ls    -l")).toEqual(["ls", "-l"]);
  });
});
