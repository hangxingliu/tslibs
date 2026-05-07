import { expect, test, describe } from "bun:test";
import { wildcardPatternToRegex } from "./wildcard-pattern-to-regexp.js";

describe("wildcardPatternToRegex", () => {
  describe("Regex Generation (String Representation)", () => {
    test("basic patterns", () => {
      expect(String(wildcardPatternToRegex("abc"))).toBe("/abc/i");
      expect(String(wildcardPatternToRegex("abc", true, true))).toBe("/^abc$/");
    });

    test("wildcard * (zero or more)", () => {
      expect(String(wildcardPatternToRegex("a*bc", true, true))).toBe("/^a.*bc$/");
      expect(String(wildcardPatternToRegex("a**bc", true, true))).toBe("/^a.*bc$/");
    });

    test("wildcard ? (single character)", () => {
      expect(String(wildcardPatternToRegex("a?bc", true, true))).toBe("/^a.{1}bc$/");
      expect(String(wildcardPatternToRegex("a??bc", true, true))).toBe("/^a.{2}bc$/");
    });

    test("mixed * and ?", () => {
      expect(String(wildcardPatternToRegex("a*?bc", true, true))).toBe("/^a.+bc$/");
      expect(String(wildcardPatternToRegex("a*??bc", true, true))).toBe("/^a.{2,}bc$/");
      expect(String(wildcardPatternToRegex("a?*?bc", true, true))).toBe("/^a.{2,}bc$/");
      expect(String(wildcardPatternToRegex("a??*bc", true, true))).toBe("/^a.{2,}bc$/");
      expect(String(wildcardPatternToRegex("??**", true, true))).toBe("/^.{2,}$/");
    });

    test("empty and short patterns", () => {
      expect(String(wildcardPatternToRegex("??"))).toBe("/.{2}/i");
      expect(String(wildcardPatternToRegex(""))).toBe("/(?:)/i");
      expect(String(wildcardPatternToRegex("", true, true))).toBe("/^$/");
    });

    test("escaping special characters", () => {
      expect(String(wildcardPatternToRegex("()", true, true))).toBe("/^\\(\\)$/");
      expect(String(wildcardPatternToRegex("*()", true, true))).toBe("/^.*\\(\\)$/");
      expect(String(wildcardPatternToRegex("*(*)", true, true))).toBe("/^.*\\(.*\\)$/");
      expect(String(wildcardPatternToRegex("*(*)*", true, true))).toBe("/^.*\\(.*\\).*$/");
      expect(String(wildcardPatternToRegex("*([)*", true, true))).toBe("/^.*\\(\\[\\).*$/");
      expect(String(wildcardPatternToRegex("*([)]*", true, true))).toBe("/^.*\\([)].*$/");
      expect(String(wildcardPatternToRegex(" "))).toBe("/ /i");
    });
  });

  describe("Functional Matching (.test())", () => {
    test("matching patterns with character classes", () => {
      const re = wildcardPatternToRegex("*([)]*", true, true);
      expect(re.test("()")).toBe(true);
      expect(re.test("+()")).toBe(true);
    });

    test("matching with alphanumeric ranges", () => {
      const re = wildcardPatternToRegex("*([)a-z]*", true, true);
      expect(re.test("+()")).toBe(true);
      expect(re.test("+(c")).toBe(true);
    });

    test("case sensitivity", () => {
      const caseInsensitive = wildcardPatternToRegex("*([)a-z]*", true, false);
      const caseSensitive = wildcardPatternToRegex("*([)a-z]*", true, true);

      expect(caseInsensitive.test("+(C")).toBe(true);
      expect(caseSensitive.test("+(C")).toBe(false);
    });

    test("complex character classes and boundary matching", () => {
      const re = wildcardPatternToRegex("*([)a-z]]*", true, true);
      expect(re.test("+(}")).toBe(false);
      expect(re.test("+()")).toBe(false);
      expect(re.test("+()]")).toBe(true);
      expect(re.test("+()]1")).toBe(true);
    });

    test("space matching", () => {
      expect(wildcardPatternToRegex(" ", true, true).test(" ")).toBe(true);
    });
  });
});
