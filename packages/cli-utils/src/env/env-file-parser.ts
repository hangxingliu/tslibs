/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { Envsubst } from "./envsubst.js";

export function parseEnvFile(conf: string): Map<string, string> {
  const lines = conf.split(/\n/);
  const vars = new Map<string, string>();
  const envSubst = new Envsubst();

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo].trim();
    if (!line) continue;
    if (/^[#;]/.test(line)) continue;
    const onInvalid = (reason: string): never => {
      throw new Error(`Invalid config at #${lineNo + 1}: ${reason}`);
    };

    // bash style
    let mtx = line.match(/^\s*(?:export\s+)?(\w+)=(['"])/);
    if (mtx) {
      let values = "";
      let ptr = 0;
      const quote: "'" | '"' = mtx[2] as any;
      const isPlainString = quote === "'";
      let pending = line.slice(mtx[0].length);
      const addNewLine = () => {
        if (ptr < pending.length) return;
        if (lineNo + 1 >= lines.length) onInvalid(`the line is not end`);
        pending += "\n" + lines[++lineNo];
      };
      addNewLine();
      while (ptr < pending.length) {
        const ch = pending[ptr++];
        addNewLine();
        if (ch === quote) break;
        if (ch === "\\" && !isPlainString) {
          const ch2 = pending[ptr++];
          addNewLine();
          if (ch2 === '"' || ch2 === "\\") {
            values += ch2;
            continue;
          }
          if (ch2 === "\n") continue;
          values += ch + ch2;
          continue;
        }
        values += ch;
        // end of while
      }
      if (!isPlainString) values = envSubst.subst(values, false);
      vars.set(mtx[1], values);
      envSubst.setVar(mtx[1], values);
      continue;
    }

    mtx = line.match(/^\s*(\w+)=(.+?);?\s*$/);
    if (mtx) {
      const val = envSubst.subst(mtx[2], false);
      vars.set(mtx[1], val);
      envSubst.setVar(mtx[1], val);
      continue;
    }
    onInvalid(JSON.stringify(line));
  }
  return vars;
}
