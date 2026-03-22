/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { networkInterfaces } from "node:os";

export function getAllIPs(family: 4 | 6) {
  const ifaces = networkInterfaces();
  const result: string[] = [];
  Object.keys(ifaces).forEach((ifaceName) => {
    const iface = ifaces[ifaceName];
    if (!iface) return;
    iface.forEach((it) => {
      if (it.internal) return;
      if (it.family === "IPv4") {
        if (family === 4) result.push(it.address);
      } else if (it.family === "IPv6") {
        if (family === 6) result.push(it.address);
      }
    });
  });
  return result;
}
