/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { EventEmitter } from "node:events";
import type { EventEmitterInterface } from "./base.js";

export class NodeEventEmitter<Events> implements EventEmitterInterface<Events, EventEmitter> {
  private readonly events = new EventEmitter();

  readonly addListener = this.events.addListener.bind(this.events) as EventEmitterInterface<
    Events,
    EventEmitter
  >["addListener"];

  readonly on = this.events.on.bind(this.events) as EventEmitterInterface<Events, EventEmitter>["on"];
  readonly once = this.events.once.bind(this.events) as EventEmitterInterface<Events, EventEmitter>["once"];

  readonly off = this.events.off.bind(this.events) as EventEmitterInterface<Events, EventEmitter>["off"];

  readonly removeListener = this.events.removeListener.bind(this.events) as EventEmitterInterface<
    Events,
    EventEmitter
  >["removeListener"];

  readonly removeAllListeners = this.events.removeAllListeners.bind(this.events) as EventEmitterInterface<
    Events,
    EventEmitter
  >["removeAllListeners"];
  readonly emit = this.events.emit.bind(this.events) as EventEmitterInterface<Events, EventEmitter>["emit"];
}
