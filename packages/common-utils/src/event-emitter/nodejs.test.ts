import { NodeEventEmitter } from "./nodejs.js";

interface TestEvents {
  error: [error: Error];
  warn: [message: string, error?: Error];
}

class A extends NodeEventEmitter<TestEvents> {
  async fetch() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.emit("error", new Error("Test error"));
        resolve();
      }, 500);
    });
  }

  fetch2 = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.emit("warn", "WARNING", new Error("Test warning"));
        resolve();
      }, 500);
    });
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
async function main() {
  const a = new A();
  a.on("error", (error) => console.error("onError", error.message));
  a.once("error", (error) => console.error("onceError", error.message));
  a.once("warn", (warn) => console.warn("onWarn", warn));
  console.log("fetch ...");
  await a.fetch();
  console.log("fetch2 ...");
  await a.fetch2();
  console.log("fetch ...");
  await a.fetch();
}
