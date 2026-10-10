import type { SharedData } from "./shared-data.js";
import type { CommandInterface, CommandMeta, CommandArgs } from "../index.js";

export class CommandEcho implements CommandInterface<SharedData> {
  getMeta(): CommandMeta {
    return {
      match: ["echo"],
      usage: [`echo <...strs>`],
    };
  }
  async onCommand(cmdName: string, cmd: CommandArgs): Promise<any> {
    const strs = cmd.getRestStr(0);
    console.log(...strs);
  }
}
