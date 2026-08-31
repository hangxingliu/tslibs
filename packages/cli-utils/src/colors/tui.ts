/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { homedir } from "node:os";
import { sep } from "node:path";

export function terminalURL(url: string, title?: string) {
  return `\x1b]8;;${url}\x1b\\${title || url}\x1b]8;;\x1b\\`;
}

export function terminalFileLink(filePath: string, title?: string) {
  const url = `file://${filePath}`;
  if (!title) {
    const HOME = homedir() + sep;
    if (filePath.startsWith(HOME)) title = `~` + sep + filePath.slice(HOME.length);
    else title = filePath;
  }
  return terminalURL(url, title);
}
