/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
export class MapWithInit<Key = string, Value = any> extends Map<Key, Value> {
  constructor(initFn: (key: Key) => Value) {
    super();
    const get = this.get.bind(this);
    this.get = (key: Key) => {
      if (this.has(key)) return get(key);
      const value = initFn(key);
      this.set(key, value);
      return value;
    };
  }
}
