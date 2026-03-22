/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { getErrorMessage, getErrorStack } from "./zero-deps/error.js";

export namespace BeforeExit {
  export const PREVENT_EXIT = Symbol("PREVENT_EXIT");
  export type Signals = "SIGINT" | "SIGUSR1" | "SIGUSR2" | "exit" | "ERROR";
  export type Listener = (code?: number, signal?: Signals) => void | Promise<void> | typeof PREVENT_EXIT;

  let installed = false;
  const listeners: Listener[] = [];
  function install() {
    if (installed) return;
    installed = true;

    // https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
    //do something when app is closing
    process.on("exit", onExit);

    //catches ctrl+c event
    process.on("SIGINT", onSignal);
    // catches "kill pid" (for example: nodemon restart)
    /** The SIGUSR1 and SIGUSR2 signals are sent to a process to indicate user-defined conditions. */
    process.on("SIGUSR1", onSignal);
    process.on("SIGUSR2", onSignal);
    /** SIGHUP. The SIGHUP signal is sent to a process when its controlling terminal is closed. It was originally designed to notify the process of a serial line drop (a hangup). In modern systems, this signal usually means that the controlling pseudo or virtual terminal has been closed. */
    process.on("SIGHUP", onSignal);
    process.on("SIGQUIT", onSignal);
    process.on("SIGTERM", onSignal);

    //catches uncaught exceptions
    // process.on("uncaughtException", cleanupForError);
  }

  function uninstall() {
    if (!installed) return;
    installed = false;

    process.off("exit", onExit);
    process.off("SIGINT", onSignal);
    process.off("SIGUSR1", onSignal);
    process.off("SIGUSR2", onSignal);
    process.off("SIGHUP", onSignal);
    process.off("SIGQUIT", onSignal);
    process.off("SIGTERM", onSignal);
  }

  function onExit(code: number) {
    printLog(code);
    cleanup(code, undefined);
  }

  function onSignal(signal: Signals) {
    printLog(undefined, signal);
    const result = cleanup(undefined, signal);
    uninstall();
    if (result.prevent) return;
    if (result.waitAll) result.waitAll.finally(() => process.kill(process.pid, signal));
    else process.kill(process.pid, signal);
  }

  export function cleanupForError(error: unknown) {
    printLog(undefined, undefined, error);
    const result = cleanup(undefined, "ERROR");
    uninstall();
    if (result.prevent) return;
    if (result.waitAll) result.waitAll.finally(() => process.exit(1));
    else process.exit(1);
  }

  function cleanup(...args: Parameters<Listener>) {
    const snapshot = [...listeners];
    listeners.length = 0;
    // console.error(`>>>> cleanup ${snapshot.length}`);

    let prevent: boolean | undefined;
    const wait: Promise<any>[] = [];
    for (const fn of snapshot) {
      try {
        const r = fn(...args);
        if (r === PREVENT_EXIT) prevent = true;
        else if (r && typeof (r as Promise<any>).then === "function") wait.push(r);
      } catch (error) {
        process.stderr.write(`cleanup error: ${getErrorMessage(error)}\n`);
      }
    }

    let waitAll: Promise<any> | undefined;
    if (wait.length > 1) waitAll = Promise.all(wait);
    else if (wait.length === 1) waitAll = wait[0];
    if (waitAll) process.stderr.write(`waiting for ${wait.length} job(s) ...\n`);
    return { prevent, waitAll };
  }

  function printLog(code?: number, signal?: string, error?: unknown) {
    let logs = `exit[${process.pid}]:`;
    if (typeof signal === "string") logs += ` ${signal}`;
    if (typeof code === "number") logs += ` code=${code}`;
    if (error) logs += ` error=${getErrorStack(error)}`;
    logs += `\n`;
    process.stderr.write(logs);
  }

  export function addEventListener(listener: Listener) {
    install();
    listeners.push(listener);
  }

  export function removeEventListener(listener: Listener) {
    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i] !== listener) continue;
      listeners.splice(i, 1);
      return true;
    }
    return false;
  }

  export function usePeacefulExit(timeout: number) {
    let stage = 0;
    let timer: any;

    const controller = new AbortController();
    const hasCheck = () => (stage = 2);
    const beforeExitListener: Listener = (code, signal) => {
      if (stage <= 1) {
        if (stage === 0) stage = 1;
        if (!timer) timer = setTimeout(hasCheck, timeout);
        controller.abort();
        return PREVENT_EXIT;
      }
      controller.abort();
    };
    addEventListener(beforeExitListener);

    return {
      signal: controller.signal,
      isExiting: () => {
        if (!stage) return false;
        stage = 2;
        return true;
      },
    };
  }
}
