import type { SharedData } from "./shared-data.js";
import type { CommandInterface, CommandMeta, CommandArgs } from "../index.js";
import { DefaultArgsParser, completeKeyword } from "../index.js";

const knownIPs = ["192.168.1.1", "127.0.0.1"];
const knownNames = ["Mike", "John"];
const knownNames2 = [...knownNames, "Undefined", "NULL"];

export class CommandTestArgs implements CommandInterface<SharedData> {
  args = new DefaultArgsParser({
    options: {
      ping: {
        short: "p",
        type: "boolean",
        completer: (val) => completeKeyword(val, knownIPs),
      },
      force: {
        short: "f",
        type: "boolean",
      },
      timeout: {
        short: "t",
        type: "boolean",
      },
    },
    rest: [1, 2],
    restCompleter: (val, leading) => completeKeyword(val, leading.length > 0 ? knownNames2 : knownNames),
  });

  getMeta(): CommandMeta {
    return {
      match: ["args"],
      usage: [`args [--ping <ip>] [--force] <name> [name2]`],
      description: "Test args parser",
      docs: {
        Options: [
          //
          "--ping <ms>",
          "--force      Force mode",
          "-t           Allow timeout",
        ].join("\n"),
      },
    };
  }

  async onCommand(cmdName: string, cmd: CommandArgs): Promise<any> {
    const { options, rest } = this.args.parse(cmd);
    console.log(options, rest);
  }

  async onCompletion(cmdName: string, args: CommandArgs) {
    return this.args.complete(args);
  }
}
