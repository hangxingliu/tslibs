/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { TypeFromJSONSchema } from "./types.js";

export async function validateSchema<Schema>(object: unknown, jsonSchema: Schema): Promise<TypeFromJSONSchema<Schema>> {
  const { Ajv } = await import("ajv");
  const useAjvFormats = await import("ajv-formats");

  const ajv = new Ajv();
  useAjvFormats.default(ajv);

  const fn = ajv.compile<TypeFromJSONSchema<Schema>>(jsonSchema as any);
  if (!fn(object)) {
    const errors = fn.errors || [];
    let message = "Invalid config: ";
    for (let i = 0; i < errors.length; i++) {
      const error = errors[i];
      message += `${i > 0 ? "\n" : ""}config${error.instancePath.replace(/\//g, ".")} ${error.message}`;
    }
    throw message;
  }

  return object;
}
