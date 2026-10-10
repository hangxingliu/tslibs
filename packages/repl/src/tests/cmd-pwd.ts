import type { SharedData } from "./shared-data.js";
import type { CommandArgs, CommandInterface, CommandMeta } from "../index.js";

export class CommandPwd implements CommandInterface<SharedData> {
  private sharedData?: SharedData;
  connect(sharedData: SharedData) {
    this.sharedData = sharedData;
  }
  getMeta(): CommandMeta {
    return {
      match: ["pwd"],
      usage: [`pwd`],
    };
  }
  async onCommand(cmdName: string, cmd: CommandArgs): Promise<any> {
    const { sharedData } = this;
    if (!sharedData) return;
    return sharedData.cwd;
  }
  async onCompletion(cmdName: string, cmd: CommandArgs) {
    return;
  }
}
