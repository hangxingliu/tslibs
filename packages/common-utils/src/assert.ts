/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export function assertProps<Resp, Key extends keyof Resp>(
  resp: Resp | undefined | null,
  prop: Key,
  type: "array" | "string" | "boolean" | "object" | "number",
  name = "props"
): Resp {
  const onInvalid = (msg: string): never => {
    throw new Error(`The type of property '${String(prop)}' in the ${name} is not ${type}. ${msg}`);
  };

  if (!resp || typeof resp !== "object" || !(prop in resp)) return onInvalid("but undefined");

  const v = resp[prop];
  const actualType = typeof resp[prop];
  if (type === "array") {
    if (!Array.isArray(v)) return onInvalid(`but ${actualType}`);
    return resp;
  }

  if (actualType !== type) return onInvalid(`but ${actualType}`);
  return resp;
}
