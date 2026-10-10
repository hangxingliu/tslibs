/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { VarResolver } from "../tokenizer/types.js";
import { VarResolverStrategy } from "../tokenizer/types.js";

export class DefaultVarResolver implements VarResolver {
  readonly map: Map<string, any>;
  strategy = VarResolverStrategy.loose;

  constructor(map?: Map<string, any>) {
    this.map = map || new Map();
  }

  get(name: string) {
    return this.map.get(name);
  }
  set(name: string, val: any) {
    return this.map.set(name, val);
  }
  delete(name: string) {
    return this.map.delete(name);
  }
  keys(keyword?: string): string[] {
    const keys: string[] = [];
    const lc = keyword ? keyword.toLowerCase() : "";
    for (const key of this.map.keys()) {
      if (lc && !key.startsWith(lc)) continue;
      keys.push(key);
    }
    return keys;
  }
}
