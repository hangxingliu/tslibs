/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { ReadonlyDeep } from "type-fest";
import type { JSONSchema, TypeFromJSONSchema } from "@hangxingliu/common-utils";

export type ToolsImplementation<T extends Record<string, ReadonlyDeep<JSONSchema>>> = {
  [key in keyof T]: (args: TypeFromJSONSchema<T[key]>) => Promise<any>;
};
