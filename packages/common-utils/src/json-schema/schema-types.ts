/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
/**
 * @see https://json-schema.org/understanding-json-schema/reference/type.html
 */
export type JSONSchemaType = "string" | "number" | "integer" | "object" | "array" | "boolean" | "null";

export const jsonSchemaTypeSet = new Set<JSONSchemaType>([
  "array",
  "boolean",
  "integer",
  "null",
  "number",
  "object",
  "string",
]);

/**
 * @see https://json-schema.org/understanding-json-schema/reference/string.html
 */
export type JSONSchemaFormat =
  | "date-time"
  | "date"
  | "time"
  | "duration"
  | "email"
  | "idn-email"
  | "hostname"
  | "idn-hostname"
  | "ipv4"
  | "ipv6"
  | "uuid"
  | "uri"
  | "uri-reference"
  | "iri"
  | "iri-reference";

export type JSONSchema = {
  /**
   * Declaring a unique identifier
   */
  $id?: string;
  /**
   * Declaring a JSON Schema
   */
  $schema?: string;
  /**
   * Referencing another schema,
   * The basic value of this field is `string`,
   * but it can be other types if there is an resolver can resolve it.
   * @see https://json-schema.org/understanding-json-schema/structuring.html#ref
   */
  $ref?: unknown;

  title?: string;
  description?: string;
  type?: JSONSchemaType | JSONSchemaType[];
  enum?: any[];
  const?: any;
  default?: any;

  //
  //#region string
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: JSONSchemaFormat;
  //#endregion string

  //
  //#region number
  multipleOf?: number;
  maximum?: number;
  minimum?: number;
  exclusiveMaximum?: number | boolean;
  exclusiveMinimum?: number | boolean;
  //#endregion number

  //
  //#region object
  properties?: { [x: string]: JSONSchema };
  patternProperties?: { [x: string]: JSONSchema };
  additionalProperties?: boolean | JSONSchema;
  minItems?: number;
  maxItems?: number;
  propertyNames?: { pattern: string };
  required?: string[];
  //#endregion object

  //
  //#region array
  items?: boolean | JSONSchema;
  /**
   * Tuple validation
   */
  prefixItems?: JSONSchema[];
  contains?: JSONSchema;
  minContains?: number;
  maxContains?: number;
  minProperties?: number;
  maxProperties?: number;
  uniqueItems?: boolean;
  //#endregion array

  //
  //#region composition
  /** AND */
  allOf?: JSONSchema[];
  /** OR */
  anyOf?: JSONSchema[];
  /** XOR */
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  //#endregion composition

  //
  //#region conditionals
  // https://json-schema.org/understanding-json-schema/reference/conditionals
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;
  //#endregion conditionals
  //
};
