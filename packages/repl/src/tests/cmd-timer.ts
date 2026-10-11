import type { SharedData } from "./shared-data.js";
import type { CommandArgs, CommandInterface, CommandMeta } from "../index.js";
import { completeKeyword, REPL } from "../index.js";

export class CommandTimer implements CommandInterface<SharedData> {
  constructor(private readonly refreshPrompt: () => void = () => {}) {}
  private sharedData?: SharedData;
  connect(sharedData: SharedData) {
    this.sharedData = sharedData;
  }
  getMeta(): CommandMeta {
    return {
      match: ["timer"],
      usage: [`timer [start|stop]`],
    };
  }

  private timer: any;
  private readonly onTimer = () => {
    REPL.log(`timer: ${new Date().toJSON()}`);
    this.refreshPrompt();
  };

  async onCommand(cmdName: string, cmd: CommandArgs): Promise<any> {
    const { sharedData } = this;
    if (!sharedData) return;

    const type = cmd.getStr(0) || "start";
    switch (type) {
      case "start":
        if (!this.timer) this.timer = setInterval(this.onTimer, 500);
        break;
      case "stop":
        if (this.timer) clearInterval(this.timer);
        delete this.timer;
        break;
      default:
        throw new Error(`unknown type "${type}"`);
    }
  }

  async onCompletion(cmdName: string, cmd: CommandArgs) {
    const { index, str, arg } = cmd.completionContext;
    if (index === 0 && arg) return completeKeyword(str, ["start", "stop"]);
  }
}
