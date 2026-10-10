import { statSync } from "fs";
import { resolve } from "path";
import type { SharedData } from "./shared-data.js";
import type { CommandInterface, CommandMeta, CommandArgs } from "../index.js";
import { completePath } from "../index.js";

export class CommandCd implements CommandInterface<SharedData> {
  private sharedData?: SharedData;
  connect(sharedData: SharedData) {
    this.sharedData = sharedData;
  }
  getMeta(): CommandMeta {
    return {
      match: ["cd"],
      usage: [`cd <path>`],
    };
  }
  async onCommand(cmdName: string, cmd: CommandArgs): Promise<any> {
    const { sharedData } = this;
    if (!sharedData) return;

    const cd = cmd.getStr(0);
    if (!cd) return;

    const newCWD = resolve(sharedData.cwd, cd);
    try {
      const st = statSync(newCWD);
      if (!st.isDirectory()) throw new Error(`"${cd}" is not a directory`);
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      return console.error(`Error: ${err}`);
    }
    sharedData.cwd = newCWD;
    return newCWD;
  }
  async onCompletion(cmdName: string, cmd: CommandArgs) {
    const { index, str, arg } = cmd.completionContext;
    if (index === 0 && arg) return completePath(str || "", this.sharedData!.cwd, { dirOnly: true, recursive: true });
  }
}
