/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
type InferAddiontalProps<Schema> = Schema extends { additionalProperties: infer AddiontalProps }
  ? Record<string, TypeFromJSONSchema<AddiontalProps>>
  : {};
type InferProps<Schema> = Schema extends { properties: infer Props }
  ? {
      [x in keyof Props]: TypeFromJSONSchema<Props[x]>;
    }
  : {};

export type TypeFromJSONSchema<Schema> = Schema extends {
  allOf: Array<infer AllOf>;
}
  ? TypeFromJSONSchema<UnionToIntersection<AllOf>>
  : Schema extends {
        oneOf: Array<infer OneOf>;
      }
    ? TypeFromJSONSchema<OneOf>
    : Schema extends {
          anyOf: Array<infer AnyOf>;
        }
      ? TypeFromJSONSchema<AnyOf>
      : Schema extends {
            enum: Array<infer Enum>;
          }
        ? Enum
        : Schema extends {
              type: "string";
            }
          ? string
          : Schema extends {
                type: "boolean";
              }
            ? boolean
            : Schema extends
                  | {
                      type: "number";
                    }
                  | {
                      type: "integer";
                    }
              ? number
              : Schema extends { type: "object" }
                ? InferAddiontalProps<Schema> & InferProps<Schema>
                : Schema extends {
                      type: "array";
                      items: infer ItemType;
                    }
                  ? TypeFromJSONSchema<ItemType>[]
                  : any;
/**
 * @see https://github.com/sindresorhus/type-fest/blob/main/source/union-to-intersection.d.ts
 */
type UnionToIntersection<Union> = (Union extends unknown ? (distributedUnion: Union) => void : never) extends (
  mergedIntersection: infer Intersection
) => void // The `& Union` is to allow indexing by the resulting type
  ? Intersection & Union
  : never;
export {};
