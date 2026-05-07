import { expect, test, describe } from "bun:test";
import { formatDate, afterNow, beforeNow, fromNow } from "./format-date.js";

describe("format-date", () => {
  describe("formatDate", () => {
    const fixedDate = new Date("2023-05-20 15:30:45");

    test("should format with all placeholders", () => {
      expect(formatDate("yyyy-mm-dd HH:MM:SS", fixedDate)).toBe("2023-05-20 15:30:45");
    });

    test("should format year with 2 digits", () => {
      expect(formatDate("yy", fixedDate)).toBe("23");
    });

    test("should handle no date provided (use now)", () => {
      const formatted = formatDate("yyyy");
      expect(formatted).toBe(new Date().getFullYear().toString());
    });
  });

  describe("afterNow", () => {
    test("should return after string for future date", () => {
      const now = new Date();
      const future = new Date(now.getTime() + 5 * 60 * 1000); // 5 mins later
      expect(afterNow(future, now)).toBe("after 5mins");
    });

    test("should return empty string for past date", () => {
      const now = new Date();
      const past = new Date(now.getTime() - 5 * 60 * 1000);
      expect(afterNow(past, now)).toBe("");
    });
  });

  describe("beforeNow", () => {
    test("should return before string for past date", () => {
      const now = new Date();
      const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      expect(beforeNow(past, now)).toBe("before 2days");
    });

    test("should return empty string for future date", () => {
      const now = new Date();
      const future = new Date(now.getTime() + 5 * 60 * 1000);
      expect(beforeNow(future, now)).toBe("");
    });
  });

  describe("fromNow", () => {
    test("should format seconds", () => {
      expect(fromNow(10 * 1000, "", "")).toBe("10s");
      expect(fromNow(-10 * 1000, "past ", "future ")).toBe("past 10s");
    });

    test("should format minutes", () => {
      expect(fromNow(5 * 60 * 1000, "", "")).toBe("5mins");
      expect(fromNow(120 * 1000, "", "")).toBe("2mins");
    });

    test("should format hours", () => {
      expect(fromNow(3 * 60 * 60 * 1000, "", "")).toBe("3hours");
      expect(fromNow(100 * 60 * 1000, "", "")).toBe("1hour");
    });

    test("should format days", () => {
      expect(fromNow(10 * 24 * 60 * 60 * 1000, "", "")).toBe("10days");
      expect(fromNow(40 * 60 * 60 * 1000, "", "")).toBe("1day");
    });

    test("should format months", () => {
      expect(fromNow(3 * 31 * 24 * 60 * 60 * 1000, "", "")).toBe("3months");
      expect(fromNow(50 * 24 * 60 * 60 * 1000, "", "")).toBe("1month");
    });

    test("should format years", () => {
      expect(fromNow(3 * 365 * 24 * 60 * 60 * 1000, "", "")).toBe("3years");
      expect(fromNow(25 * 31 * 24 * 60 * 60 * 1000, "", "")).toBe("2years");
    });

    test("should return empty string for very small diff", () => {
      expect(fromNow(500, "", "")).toBe("");
    });
  });
});
