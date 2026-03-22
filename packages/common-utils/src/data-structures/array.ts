/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length;
  let randomIndex: number;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

/**
 * Splits an array into two new arrays based on a provided filter function.
 *
 * @template T The type of elements in the array.
 * @param arr The input array to be split.
 * @param filter A function that determines which array an element belongs to. It should return `true` for elements that go into `filtered` and `false` for elements that go into `rest`.
 * @returns An object containing two arrays: `filtered` (elements for which the filter returned `true`) and `rest` (elements for which the filter returned `false`).
 */
export function splitArray<T>(
  arr: ReadonlyArray<T>,
  filter: (val: T, index: number) => boolean
): { filtered: T[]; rest: T[] } {
  const filtered: T[] = [];
  const rest: T[] = [];
  for (let i = 0; i < arr.length; i++) {
    const matched = filter(arr[i], i);
    (matched ? filtered : rest).push(arr[i]);
  }
  return { filtered, rest };
}
