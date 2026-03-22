/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

export type FirstParam<T extends (args: any) => any> = Parameters<T>[0];

export type PartialByKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ItemType<T> = T extends ReadonlyArray<infer Item> ? Item : unknown;

export type OverrideProps<Base extends Record<string, any>, Override extends { [key in keyof Base]?: any }> = Omit<
  Base,
  keyof Override
> &
  Override;
