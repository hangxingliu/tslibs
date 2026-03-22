/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { EventEmitter } from "node:events";

export interface EventEmitterInterface<Events, EventEmitterClass = EventEmitter> {
  addListener<EventName extends keyof Events>(
    event: EventName,
    handler: Events[EventName] extends unknown[] ? (...args: Events[EventName]) => void : never
  ): EventEmitterClass;

  on<EventName extends keyof Events>(
    event: EventName,
    handler: Events[EventName] extends unknown[] ? (...args: Events[EventName]) => void : never
  ): EventEmitterClass;

  once<EventName extends keyof Events>(
    event: EventName,
    handler: Events[EventName] extends unknown[] ? (...args: Events[EventName]) => void : never
  ): EventEmitterClass;

  removeListener<EventName extends keyof Events>(
    event: EventName,
    handler: Events[EventName] extends unknown[] ? (...args: Events[EventName]) => void : never
  ): EventEmitterClass;

  off<EventName extends keyof Events>(
    event: EventName,
    handler: Events[EventName] extends unknown[] ? (...args: Events[EventName]) => void : never
  ): EventEmitterClass;

  removeAllListeners<EventName extends keyof Events>(event: EventName): EventEmitterClass;

  emit<EventName extends keyof Events>(
    event: EventName,
    ...args: Events[EventName] extends unknown[] ? Events[EventName] : never[]
  ): boolean;
}
