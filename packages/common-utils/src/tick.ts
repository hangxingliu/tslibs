/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { setTimeout } from "node:timers/promises";

export class Tick {
  private lastTick: number;

  ms = 0;
  get str() {
    let sec = this.ms / 1000;
    if (sec > 60) {
      const min = Math.floor(sec / 60);
      sec -= min * 60;
      return min + "m " + Math.floor(sec) + "s";
    }
    return sec.toFixed(2) + "s";
  }

  readonly tick = () => {
    this.ms = performance.now() - this.lastTick;
    this.lastTick = performance.now();
    return { ms: this.ms, str: this.str };
  };

  readonly throttle = async (ms: number, signal?: AbortSignal) => {
    const sleepTime = ms - (performance.now() - this.lastTick);
    if (sleepTime < 1) return;
    await setTimeout(sleepTime, null, { signal });
  };

  constructor() {
    this.lastTick = performance.now();
  }
}
