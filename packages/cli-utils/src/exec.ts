/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { Readable } from "stream";
import type { ChildProcess, SpawnOptionsWithoutStdio } from "child_process";
import { spawn } from "child_process";
import { escapeShellArg } from "./zero-deps/shell-args-escape.js";

export type ExecOptions = {
  cwd?: string;
  env?: Record<string, string>;

  /**
   * `"inherit"`: use `inherit` as the value of stdio[0] (__by default__),
   * `false`:  use `ignore` as the value of stdio[0] (/dev/null)
   */
  stdin?: boolean | "inherit" | Readable;
  stdout?: boolean | "inherit" | ((data: Buffer) => void);
  stderr?: boolean | "inherit" | ((data: Buffer) => void);
  onStart?: (process: ChildProcess) => void;

  /** The expected exit code */
  code?: number | ((code: number | null) => boolean);
};

export type ExecResult = {
  cmd: string[];
  code: number | null;
  signal: string | null;
  stdout?: Buffer;
  stderr?: Buffer;
};

export class ExecError extends Error {
  static is(e: unknown): e is ExecError {
    return e && e instanceof Error && "exec" in e ? true : false;
  }

  static print(e: ExecError) {
    const { cmd, code, signal, stderr, stdout } = e.exec;
    console.error(`command: ${cmd.map(escapeShellArg).join(" ")}`);
    console.error(`stdout: ${toString(stdout)}`);
    console.error(`stderr: ${toString(stderr)}`);
    console.error(`  code: ${code} signal: ${signal || ""}`);
    console.error(` error: ${e.stack}`);
    function toString(buf?: Buffer) {
      if (!buf) return "";
      return buf.subarray(0, 4096).toString();
    }
  }

  constructor(
    message: string,
    readonly exec: ExecResult
  ) {
    super(message);
  }
}

export function exec(command: string[], options: ExecOptions = {}) {
  const cmdName = command[0];
  const cmdArgs = command.slice(1);

  const spawnOptions: SpawnOptionsWithoutStdio = {};
  const { cwd, env } = options;
  if (typeof cwd !== "undefined" && cwd !== null) spawnOptions.cwd = cwd;
  if (typeof env !== "undefined" && env !== null) spawnOptions.env = env;

  let assertCode: undefined | ((code: number | null) => boolean);
  if (typeof options.code === "number") {
    const expected = options.code;
    assertCode = (actual) => actual === expected;
  } else if (typeof options.code === "function") {
    assertCode = options.code;
  }

  type StdioType = "pipe" | "inherit" | "ignore";
  const { stdin, stdout, stderr } = options;
  let stdinType: StdioType;
  let stdinStream: Readable | undefined;
  if (stdin === false) {
    stdinType = "ignore";
  } else if (stdin === undefined || stdin === true || stdin === "inherit") {
    stdinType = "inherit";
  } else {
    stdinType = "pipe";
    stdinStream = stdin;
  }
  const stdoutType = getOutputType(stdout);
  const stderrType = getOutputType(stderr);

  return new Promise<ExecResult>((resolve, reject) => {
    const p = spawn(cmdName, cmdArgs, {
      ...spawnOptions,
      stdio: [stdinType, stdoutType, stderrType],
    });
    const stdoutData: Buffer[] = [];
    const stderrData: Buffer[] = [];

    if (stdinStream && p.stdin) stdinStream.pipe(p.stdin);
    p.stdout?.on("data", (data) => {
      if (typeof stdout === "function") stdout(data);
      stdoutData.push(data);
    });
    p.stderr?.on("data", (data) => {
      if (typeof stderr === "function") stderr(data);
      stderrData.push(data);
    });
    p.on("error", (error) => {
      cleanStdin();
      reject(error);
    });
    p.on("exit", (code, signal) => {
      const result: ExecResult = { cmd: command, code, signal };
      if (stdoutData.length > 0) result.stdout = Buffer.concat(stdoutData);
      if (stderrData.length > 0) result.stderr = Buffer.concat(stderrData);
      try {
        cleanStdin();
        const codeIsOK = assertCode ? assertCode(code) : true;
        if (!codeIsOK) throw new ExecError(`${cmdName} exits with the code ${code}`, result);
      } catch (error) {
        return reject(error);
      }
      return resolve(result);
    });
    if (options.onStart) options.onStart(p);
    function cleanStdin() {
      if (!stdinStream || !p.stdin) return;
      stdinStream.unpipe(p.stdin);
    }
  });

  function getOutputType(type: ExecOptions["stdout"]) {
    if (typeof type === "function" || type === true) return "pipe";
    if (type === false) return "ignore";
    return "inherit";
  }
}
