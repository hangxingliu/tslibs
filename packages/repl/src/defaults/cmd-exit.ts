/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { SYMBOL_EXIT, type CommandInterface, type CommandMeta } from "../types.js";

/** Register explicitly to enable the exit command. */
export class CommandExit implements CommandInterface {
  getMeta(): CommandMeta {
    return { match: ["exit"], usage: ["exit"], description: "Exit the command loop" };
  }

  async onCommand() {
    return SYMBOL_EXIT;
  }
}
