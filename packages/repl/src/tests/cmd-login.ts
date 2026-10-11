import { REPL, type CommandInterface, type CommandMeta } from "../index.js";

export class CommandLoginServer implements CommandInterface {
  getMeta(): CommandMeta {
    return {
      match: ["login"],
      usage: ["login"],
      description: "Demonstrate username completion and hidden password input",
    };
  }

  async onCommand() {
    const username = await REPL.inputLine({
      prompt: "Username: ",
      completer: async (line) => ["admin", "guest"].filter((name) => name.startsWith(line)),
    });
    const password = await REPL.inputLine({ prompt: "Password: ", password: true });
    REPL.log(`Login input received for "${username}" (${password.length} password characters).`);
  }
}
