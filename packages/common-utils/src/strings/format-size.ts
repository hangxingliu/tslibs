/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
const base = ["Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi", "Yi"] as const;
const baseSI = ["k", "M", "G", "T", "P", "E", "Z", "Y"] as const;

/**
 * https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/10420404
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 */
export function formatSize(bytes: number, si: boolean, unit = "B") {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + " " + unit;
  }

  const units = si ? baseSI : base;
  let u = -1;
  const dp = 1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);
  return bytes.toFixed(dp) + " " + units[u] + unit;
}
