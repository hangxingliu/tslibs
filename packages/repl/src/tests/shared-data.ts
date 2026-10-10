import type { REPLServer } from "repl";
import type { CommandMeta, SharedDataBase } from "../index.js";
import { DefaultVarResolver } from "../index.js";

export class SharedData implements SharedDataBase {
  repl?: REPLServer | undefined;
  lastResult?: unknown;
  commandMetas: CommandMeta[] = [];
  vars = new DefaultVarResolver(new Map<string, any>([["hello", 1]]));

  private _cwd?: string;
  get cwd() {
    if (!this._cwd) this._cwd = process.cwd();
    return this._cwd;
  }
  set cwd(path: string) {
    this._cwd = path;
  }
}
