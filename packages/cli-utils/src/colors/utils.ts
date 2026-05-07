/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

/** Mapping of command-line flags to their corresponding color support status. */
const COLOR_ARGUMENT_FLAGS = new Map<string, boolean>([
  ["--no-color", false],
  ["--no-colors", false],
  ["--color=false", false],
  ["--color", true],
  ["--colors", true],
  ["--color=true", true],
  ["--color=always", true],
  ["--color=16m", true],
  ["--color=full", true],
  ["--color=truecolor", true],
  ["--color=256", true],
]);

/**
 * Determines whether the given output stream supports color.
 *
 * The detection follows this priority:
 * 1. Command-line arguments (e.g., `--color`, `--no-color`)
 * 2. Environment variables (`FORCE_COLOR`, `NO_COLOR`)
 * 3. Stream TTY status and terminal type (`TERM`)
 *
 * @param stream - The writable stream to check (e.g., process.stdout or process.stderr).
 * @returns `true` if color is supported, `false` otherwise.
 */
export function isColorSupported(stream?: NodeJS.WriteStream | "stderr" | "stdout"): boolean {
  const { argv, env } = process;

  // 1. Check command-line arguments
  if (Array.isArray(argv)) {
    for (const arg of argv) {
      if (arg === "--") {
        break;
      }
      const flagStatus = COLOR_ARGUMENT_FLAGS.get(arg);
      if (flagStatus !== undefined) {
        return flagStatus;
      }
    }
  }

  // 2. Check FORCE_COLOR environment variable
  // See: https://nodejs.org/api/cli.html#force_color1-2-3
  if (env.FORCE_COLOR !== undefined) {
    return env.FORCE_COLOR !== "0" && env.FORCE_COLOR.toLowerCase() !== "false";
  }

  // 3. Check NO_COLOR environment variable (Standard: https://no-color.org/)
  if (env.NO_COLOR !== undefined) {
    return false;
  }

  // 4. Check for "dumb" terminal
  if (env.TERM === "dumb") {
    return false;
  }

  if (stream === undefined) {
    stream = process.stdout;
  } else if (typeof stream === "string") {
    stream = stream === "stderr" ? process.stderr : process.stdout;
  }

  // 5. Check if the stream is a TTY
  if (stream && stream.isTTY) {
    return true;
  }

  // 6. Check for Common CI environments which usually support colors
  if (env.CI) {
    const ciNames = ["GITHUB_ACTIONS", "GITLAB_CI", "CIRCLECI", "TRAVIS", "JENKINS_URL"];
    if (ciNames.some((name) => name in env)) {
      return true;
    }
  }

  return false;
}
