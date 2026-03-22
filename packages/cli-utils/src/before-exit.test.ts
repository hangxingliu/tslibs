import { setTimeout } from "timers/promises";
import { BeforeExit } from "./before-exit.js";

main().catch(BeforeExit.cleanupForError);
async function main() {
  BeforeExit.addEventListener(async () => {
    console.log("cleanup...");
    await setTimeout(1000);
    console.log("done");
  });

  for (let i = 0; i < 2; i++) {
    console.log("timeout: START");
    const ok = await setTimeout(5000, true);
    throw "???";
    console.log(`timeout: DONE (${ok})`);
  }
}
