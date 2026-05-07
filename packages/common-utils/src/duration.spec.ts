import { expect, test, describe } from "bun:test";
import { Duration } from "./duration.js";

describe("Duration", () => {
  describe("Parsing with Units", () => {
    test("should parse milliseconds", () => {
      expect(new Duration("100ms").milliseconds).toBe(100);
      expect(new Duration("1 millisecond").milliseconds).toBe(1);
      expect(new Duration("500 milliseconds").milliseconds).toBe(500);
    });

    test("should parse seconds", () => {
      expect(new Duration("1s").milliseconds).toBe(1000);
      expect(new Duration("2.5 seconds").milliseconds).toBe(2500);
    });

    test("should parse minutes", () => {
      expect(new Duration("1m").milliseconds).toBe(60 * 1000);
      expect(new Duration("10 minutes").milliseconds).toBe(10 * 60 * 1000);
    });

    test("should parse hours", () => {
      expect(new Duration("1h").milliseconds).toBe(60 * 60 * 1000);
      expect(new Duration("1.5 hours").milliseconds).toBe(1.5 * 60 * 60 * 1000);
    });

    test("should parse days", () => {
      expect(new Duration("1d").milliseconds).toBe(24 * 60 * 60 * 1000);
      expect(new Duration("2 days").milliseconds).toBe(2 * 24 * 60 * 60 * 1000);
    });

    test("should handle spaces and casing", () => {
      expect(new Duration(" 100 MS ").milliseconds).toBe(100);
      expect(new Duration("1.5  Hours").milliseconds).toBe(1.5 * 60 * 60 * 1000);
    });

    test("should handle negative durations", () => {
      expect(new Duration("-10s").milliseconds).toBe(-10000);
    });

    test("should handle commas in numbers", () => {
      expect(new Duration("1,000ms").milliseconds).toBe(1000);
    });
  });

  describe("Parsing Numbers", () => {
    test("should parse pure numbers as milliseconds", () => {
      expect(new Duration(5000).milliseconds).toBe(5000);
      expect(new Duration("123.45").milliseconds).toBe(123.45);
    });
  });

  describe("Invalid Inputs", () => {
    test("should mark invalid strings", () => {
      expect(new Duration("abc").isValid).toBe(false);
      expect(new Duration("").isValid).toBe(false);
      expect(new Duration("10x").isValid).toBe(false);
    });

    test("should mark invalid types", () => {
      expect(new Duration({} as any).isValid).toBe(false);
      expect(new Duration(null as any).isValid).toBe(false);
    });
  });
});
