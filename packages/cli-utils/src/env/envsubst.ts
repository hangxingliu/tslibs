/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { homedir } from "os";
/**
 * This utility is similar to the Linux command `envsubst`
 *
 * > substitutes environment variables in shell format strings
 */
export class Envsubst {
  private extraVars: Map<string, string>;
  private home: string;
  private cwd: string;

  constructor(extraVars?: Map<string, string>) {
    this.extraVars = extraVars || new Map<string, string>();
    this.home = homedir();
    this.cwd = process.cwd();
    if (!this.extraVars.has("HOME")) this.extraVars.set("HOME", this.home);
    if (!this.extraVars.has("PWD")) this.extraVars.set("PWD", this.cwd);
  }

  setVar(name: string, value: string) {
    this.extraVars.set(name, value);
  }

  subst(input: string, strict?: boolean): string;
  subst(input: string[], strict?: boolean): string[];
  subst(input: string | string[], strict = false): string | string[] {
    if (Array.isArray(input)) return input.map((it) => this.subst(it, strict));
    if (typeof input !== "string") return input;
    const { extraVars } = this;
    if (input.startsWith("~/")) input = this.home + input.slice(1);
    return input.replace(/\$(?:(\w+)|\{(\w+)\})/g, envReplacer);

    function envReplacer(matched: string, name1: string, name2: string): string {
      const name = name1 || name2;
      if (extraVars && extraVars.has(name)) return extraVars.get(name) || "";
      if (Object.prototype.hasOwnProperty.call(process.env, name)) return process.env[name] || "";
      if (strict) throw new Error(`Unknown variable \`${name}\``);
      return "";
    }
  }
}
