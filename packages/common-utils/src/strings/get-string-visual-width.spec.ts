import { expect, test, describe } from "bun:test";
import { getStringVisualWidth } from "./get-string-visual-width.js";

describe("getStringVisualWidth", () => {
  test("ASCII characters should have width 1", () => {
    expect(getStringVisualWidth("Hello")).toBe(5);
    expect(getStringVisualWidth("1234567890")).toBe(10);
    expect(getStringVisualWidth(" ")).toBe(1);
  });

  test("CJK characters should have width 2", () => {
    expect(getStringVisualWidth("你好")).toBe(4);
    expect(getStringVisualWidth("こんにちは")).toBe(10);
    expect(getStringVisualWidth("한국어")).toBe(6);
  });

  test("Simple emojis should have width 2", () => {
    expect(getStringVisualWidth("🍎")).toBe(2);
    expect(getStringVisualWidth("🚀")).toBe(2);
  });

  test("Complex Emoji sequences (ZWJ) should have width 2", () => {
    // Visually one block
    expect(getStringVisualWidth("👨‍👩‍👧‍👦")).toBe(2);
    expect(getStringVisualWidth("🏳️‍🌈")).toBe(2);
  });

  test("Mixed strings should calculate correct total width", () => {
    // "Hi, " (4) + "世界" (4) + "! " (2) + "🌍" (2) = 12
    expect(getStringVisualWidth("Hi, 世界! 🌍")).toBe(12);
  });

  test("Empty or null-ish strings should have width 0", () => {
    expect(getStringVisualWidth("")).toBe(0);
    expect(getStringVisualWidth(null as any)).toBe(0);
    expect(getStringVisualWidth(undefined as any)).toBe(0);
  });

  test("Full-width symbols should have width 2", () => {
    expect(getStringVisualWidth("（）")).toBe(4); // Full-width parenthesis
    expect(getStringVisualWidth("，。")).toBe(4); // Full-width comma and period
  });
});
