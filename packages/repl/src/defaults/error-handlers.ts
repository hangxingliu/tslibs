/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import type { HistoryFileError, LoadHistoryFileOptions } from "../readline/types.js";

export function getDefaultHistoryFileErrorHandler(
  onWarn: (...args: unknown[]) => void
): LoadHistoryFileOptions["onError"] {
  let warned = false;
  return (failure: HistoryFileError) => {
    if (warned) return;
    warned = true;
    onWarn(`History ${failure.operation} failed for "${failure.filePath}":`, failure.error);
  };
}
