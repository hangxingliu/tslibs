/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export function groupItemsByCount<T>(items: T[], count: number): T[][] {
  const result: T[][] = [];
  let i = 0;
  while (i < items.length) {
    result.push(items.slice(i, i + count));
    i += count;
  }
  return result;
}

export function groupItems<Item, Key extends string>(items: Item[], groupBy: (item: Item) => Key): Record<Key, Item[]> {
  const result: Record<Key, Item[]> = Object.create(null);
  for (const item of items) {
    const key = groupBy(item);
    if (key in result) result[key].push(item);
    else result[key] = [item];
  }
  return result;
}

export function groupItemsToArray<Item, Key extends string>(
  items: Item[],
  groupBy: (item: Item) => Key
): Array<[Key, Item[]]> {
  const result = groupItems(items, groupBy);
  return Object.entries(result) as Array<[Key, Item[]]>;
}
