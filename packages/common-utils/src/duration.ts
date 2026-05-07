/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */

/** Base time units in milliseconds. */
const TIME_UNIT_BASE = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
} as const;

/** Mapping of unit strings to their millisecond values. */
const UNIT_TO_MILLISECONDS: Record<string, number> = {
  ms: TIME_UNIT_BASE.ms,
  millisecond: TIME_UNIT_BASE.ms,
  milliseconds: TIME_UNIT_BASE.ms,
  s: TIME_UNIT_BASE.s,
  second: TIME_UNIT_BASE.s,
  seconds: TIME_UNIT_BASE.s,
  m: TIME_UNIT_BASE.m,
  minute: TIME_UNIT_BASE.m,
  minutes: TIME_UNIT_BASE.m,
  h: TIME_UNIT_BASE.h,
  hour: TIME_UNIT_BASE.h,
  hours: TIME_UNIT_BASE.h,
  d: TIME_UNIT_BASE.d,
  day: TIME_UNIT_BASE.d,
  days: TIME_UNIT_BASE.d,
};

/**
 * Represents a time duration and provides parsing from strings or numbers.
 *
 * Supported formats:
 * - Numbers (treated as milliseconds)
 * - Strings with units: "100ms", "1.5h", "2 days", "30 minutes"
 * - Pure numeric strings: "5000" (treated as milliseconds)
 */
export class Duration {
  /** Whether the input was successfully parsed into a valid duration. */
  readonly isValid: boolean;
  /** The original input value provided to the constructor. */
  readonly raw: string;
  /** The total duration in milliseconds. Undefined if the input was invalid. */
  readonly milliseconds?: number;

  constructor(input: string | number) {
    this.raw = String(input);

    if (typeof input !== "string" && typeof input !== "number") {
      this.isValid = false;
      return;
    }

    const normalizedInput = this.raw.toLowerCase().trim();
    if (normalizedInput.length === 0) {
      this.isValid = false;
      return;
    }

    // Match patterns like "1.5h" or "-100 ms"
    const durationWithUnitMatch = normalizedInput.match(
      /^(-?[\d\.,]+)\s*(ms|milliseconds?|s|seconds?|m|minutes?|h|hours?|d|days?)$/
    );

    if (durationWithUnitMatch) {
      const numericPart = durationWithUnitMatch[1].replace(/,/g, "");
      const unitPart = durationWithUnitMatch[2];
      const value = parseFloat(numericPart);

      if (isNaN(value)) {
        this.isValid = false;
        return;
      }

      const unitMultiplier = UNIT_TO_MILLISECONDS[unitPart];
      if (unitMultiplier === undefined) {
        this.isValid = false;
        return;
      }

      this.milliseconds = value * unitMultiplier;
      this.isValid = true;
      return;
    }

    // Match pure numeric strings (e.g., "5000" or "-1,000.50")
    if (/^-?[\d\.,]+$/.test(normalizedInput)) {
      const value = parseFloat(normalizedInput.replace(/,/g, ""));
      if (isNaN(value)) {
        this.isValid = false;
        return;
      }
      this.milliseconds = value;
      this.isValid = true;
      return;
    }

    this.isValid = false;
  }
}
