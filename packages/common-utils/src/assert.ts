/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export type ExpectedType = "array" | "string" | "boolean" | "object" | "number";

export function assertProps<Resp, Key extends keyof Resp>(
  resp: Resp | undefined | null,
  prop: Key | null | undefined,
  type: ExpectedType | Array<ExpectedType>,
  name = "props"
): asserts resp is Resp {
  const hasProp = prop === null || prop === undefined;
  const onInvalid = (msg: string): never => {
    const typeStr = typeof type === "string" ? type : `one of ${type.join("/")}`;
    if (hasProp) throw new Error(`The type of ${name} is not ${typeStr}. ${msg}`);
    throw new Error(`The type of property '${String(prop)}' in the ${name} is not ${typeStr}. ${msg}`);
  };

  if (hasProp) {
    if (resp === null || resp === undefined) return onInvalid("but undefined");
  } else {
    if (!resp || typeof resp !== "object" || !(prop! in resp)) return onInvalid("but undefined");
  }

  const v = hasProp ? resp : resp[prop];
  const actualType = typeof v;
  for (const t of Array.isArray(type) ? type : [type]) {
    if (t === "array") {
      if (Array.isArray(v)) return;
      continue;
    }
    if (actualType === t) return;
  }
  return onInvalid(`but ${actualType}`);
}
