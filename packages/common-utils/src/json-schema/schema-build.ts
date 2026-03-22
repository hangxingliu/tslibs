/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { JSONSchema, JSONSchemaType } from "./schema-types.js";

export namespace JSONSchemaBuilder {
  export type ExtraProps = string | Partial<JSONSchema> | undefined | null;
  export type JSONSchemaWithType<Type> = Omit<JSONSchema, "type"> & { type: Type };
  type DetailedSchema<Type extends JSONSchemaType, Overrides extends Record<string, any> = {}> = Omit<
    JSONSchema,
    "type" | keyof Overrides
  > & { type: Type } & Overrides;

  function buildSchema<T extends JSONSchema>(base: T, props?: ExtraProps): T {
    if (typeof props === "string") base.description = props;
    else if (props) Object.assign(base, props);
    return base;
  }

  export function isObj<Props extends Record<string, JSONSchema>>(
    fields: Readonly<Props>,
    props?: ExtraProps
  ): DetailedSchema<"object", { properties: Props }> {
    return buildSchema({ type: "object", properties: fields }, props) as any;
  }

  export function isArr<Item extends JSONSchema>(
    items: Readonly<Item>,
    props?: ExtraProps
  ): DetailedSchema<"array", { items: Item }> {
    return buildSchema({ type: "array", items }, props) as any;
  }

  export function isBool(defaultVal?: boolean, props?: ExtraProps): DetailedSchema<"boolean">;
  export function isBool(defaultVal?: string | Partial<JSONSchema>): DetailedSchema<"boolean">;
  export function isBool(
    defaultVal?: boolean | string | Partial<JSONSchema>,
    props?: ExtraProps
  ): DetailedSchema<"boolean"> {
    if (typeof defaultVal !== "boolean") {
      props = defaultVal;
      defaultVal = undefined;
    }
    return buildSchema({ type: "boolean", default: defaultVal }, props);
  }

  export function isUUID(props?: ExtraProps): DetailedSchema<"string"> {
    return buildSchema({ type: "string", format: "uuid" }, props);
  }

  export function isStr(props?: ExtraProps): DetailedSchema<"string"> {
    return buildSchema({ type: "string" }, props);
  }

  export function isPort(props?: ExtraProps): DetailedSchema<"integer"> {
    return buildSchema({ type: "integer", minimum: 1, maximum: 65535 }, props);
  }

  export function isInt(props?: ExtraProps): DetailedSchema<"integer"> {
    return buildSchema({ type: "integer" }, props);
  }

  export function isNum(props?: ExtraProps): DetailedSchema<"number"> {
    return buildSchema({ type: "number" }, props);
  }

  export function isStrEnum<Enum extends string>(
    enumVals: ReadonlyArray<Enum>,
    props?: ExtraProps
  ): DetailedSchema<"array", { enum: Enum[] }> {
    return buildSchema({ type: "string", enum: enumVals as Enum[] }, props) as any;
  }
}
