/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
function pad2(num: number) {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * - `yyyy`: year (4 digits)
 * - `yy`:   year (2 digits)
 * - `mm`:   month
 * - `dd`:   date
 * - `HH`:   hour
 * - `MM`:   minute
 * - `SS`:   second
 */
export function formatDate(format: string, date?: Date) {
  if (!date) date = new Date();
  return format.replace(/(yy(?:yy)?|mm|dd|HH|MM|SS)/g, (_, placeholder) => {
    switch (placeholder) {
      case "yyyy":
        return date.getFullYear().toString();
      case "yy":
        return date.getFullYear().toString().slice(2);
      case "mm":
        return pad2(date.getMonth() + 1);
      case "dd":
        return pad2(date.getDate());
      case "HH":
        return pad2(date.getHours());
      case "MM":
        return pad2(date.getMinutes());
      case "SS":
        return pad2(date.getSeconds());
      default:
        throw `Invalid format string "${placeholder}"`;
    }
  });
}

/**
 * Returns a human-readable string indicating the time after the current moment (or a provided 'now' date)
 * for the given date, such as "after 5mins". Returns an empty string if the date is not after now.
 * @param date - The target date to compare.
 * @param now - Optional current date for comparison (defaults to new Date()).
 * @param prep - Optional preposition prefix (defaults to "after ").
 * @returns A formatted string or an empty string.
 */
export function afterNow(date: Date, now?: Date, prep = "after "): string {
  if (!now) now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return "";
  return fromNow(diff, "", prep);
}

/**
 * Returns a human-readable string indicating the time before the current moment (or a provided 'now' date)
 * for the given date, such as "before 2days". Returns an empty string if the date is not before now.
 * @param date - The target date to compare.
 * @param now - Optional current date for comparison (defaults to new Date()).
 * @param prep - Optional preposition prefix (defaults to "before ").
 * @returns A formatted string or an empty string.
 */
export function beforeNow(date: Date, now?: Date, prep = "before "): string {
  if (!now) now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff >= 0) return "";
  return fromNow(diff, prep, "");
}

/**
 * Converts a time difference in milliseconds to a human-readable string, such as "after 3hours" or "before 1year",
 * choosing the appropriate preposition based on the sign of the difference.
 * @param diff - The time difference in milliseconds (positive for future, negative for past).
 * @param prepBefore - Preposition for past differences (defaults to "before ").
 * @param prepAfter - Preposition for future differences (defaults to "after ").
 * @returns A formatted string or an empty string for negligible differences.
 */
export function fromNow(diff: number, prepBefore = "before ", prepAfter = "after "): string {
  diff /= 1000;
  let prep = prepAfter;
  if (diff < 0) {
    diff = -diff;
    prep = prepBefore;
  }
  if (diff < 1) return "";

  if (diff < 90) {
    const val = Math.floor(diff);
    return `${prep}${val}s`;
  }

  diff /= 60; // min
  if (diff < 90) {
    const val = Math.floor(diff);
    return `${prep}${val}min${val >= 2 ? "s" : ""}`;
  }

  diff /= 60; // hour
  if (diff < 36) {
    const val = Math.floor(diff);
    return `${prep}${val}hour${val >= 2 ? "s" : ""}`;
  }

  diff /= 24; // day
  if (diff < 46) {
    const val = Math.floor(diff);
    return `${prep}${val}day${val >= 2 ? "s" : ""}`;
  }

  const monthDiff = Math.floor(diff / 30.42); // month
  if (monthDiff < 24) {
    return `${prep}${monthDiff}month${monthDiff >= 2 ? "s" : ""}`;
  }

  diff /= 365; // year
  const val = Math.floor(diff);
  return `${prep}${val}year${val >= 2 ? "s" : ""}`;
}
