import type { Completer } from "readline";
import { createInterface } from "readline";

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
async function main() {
  const completerLines: string[] = [];
  const completer: Completer = (line) => {
    completerLines.push(line);
    return [["replace"], line.slice(line.length - 7)];
  };

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
  });
  rl.on("line", (line) => {
    console.log(`line: <${line}>`);
    for (const cl of completerLines) console.log(`cline: <${cl}>`);
    completerLines.length = 0;
  });
  rl.resume();
}
