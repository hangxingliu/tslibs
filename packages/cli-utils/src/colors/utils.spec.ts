import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { isColorSupported } from "./utils.js";

describe("isColorSupported", () => {
  const originalEnv = process.env;
  const originalArgv = process.argv;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
    // Clear standard color envs
    delete process.env.FORCE_COLOR;
    delete process.env.NO_COLOR;
    delete process.env.TERM;
    delete process.env.CI;
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  test("should detect color support from command line flags", () => {
    process.argv = ["node", "test.js", "--color"];
    expect(isColorSupported({ isTTY: false } as any)).toBe(true);

    process.argv = ["node", "test.js", "--no-color"];
    expect(isColorSupported({ isTTY: true } as any)).toBe(false);

    process.argv = ["node", "test.js", "--color=256"];
    expect(isColorSupported({ isTTY: false } as any)).toBe(true);
  });

  test("should detect color support from FORCE_COLOR", () => {
    process.env.FORCE_COLOR = "1";
    expect(isColorSupported({ isTTY: false } as any)).toBe(true);

    process.env.FORCE_COLOR = "0";
    expect(isColorSupported({ isTTY: true } as any)).toBe(false);

    process.env.FORCE_COLOR = "false";
    expect(isColorSupported({ isTTY: true } as any)).toBe(false);
  });

  test("should respect NO_COLOR", () => {
    process.env.NO_COLOR = "true";
    expect(isColorSupported({ isTTY: true } as any)).toBe(false);
  });

  test("should return false for TERM=dumb", () => {
    process.env.TERM = "dumb";
    expect(isColorSupported({ isTTY: true } as any)).toBe(false);
  });

  test("should return true for TTY stream", () => {
    expect(isColorSupported({ isTTY: true } as any)).toBe(true);
    expect(isColorSupported({ isTTY: false } as any)).toBe(false);
  });

  test("should detect color support in CI environments", () => {
    process.env.CI = "true";
    process.env.GITHUB_ACTIONS = "true";
    expect(isColorSupported({ isTTY: false } as any)).toBe(true);
  });

  test("should stop parsing arguments at --", () => {
    process.argv = ["node", "test.js", "--", "--color"];
    expect(isColorSupported({ isTTY: false } as any)).toBe(false);
  });
});
