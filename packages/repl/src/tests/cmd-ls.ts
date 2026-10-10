import type { SharedData } from "./shared-data.js";
import type { CommandArgs, CommandInterface, CommandMeta } from "../index.js";
import { readdirSync } from "fs";

export class CommandLs implements CommandInterface<SharedData> {
  private sharedData?: SharedData;
  connect(sharedData: SharedData) {
    this.sharedData = sharedData;
  }
  getMeta(): CommandMeta {
    return {
      match: ["ls", "ll"],
      usage: [`ls|ll`],
    };
  }
  async onCommand(cmdName: string, cmd: CommandArgs): Promise<any> {
    const { sharedData } = this;
    if (!sharedData) return;

    try {
      const items = readdirSync(sharedData.cwd);
      return items;
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      return console.error(`Error: ${err}`);
    }
  }
  async onCompletion(cmdName: string, cmd: CommandArgs) {
    return;
  }
}
