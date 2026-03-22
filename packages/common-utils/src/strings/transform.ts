/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

export function tolower<T extends string>(str: T): Lowercase<T> {
  return str.toLowerCase() as Lowercase<T>;
}

export function toupper<T extends string>(str: T): Uppercase<T> {
  return str.toUpperCase() as Uppercase<T>;
}
