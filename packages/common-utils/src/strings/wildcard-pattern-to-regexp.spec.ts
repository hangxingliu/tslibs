import { deepStrictEqual } from "node:assert";
import { wildcardPatternToRegex } from "./wildcard-pattern-to-regexp.js";

deepStrictEqual(String(wildcardPatternToRegex("abc")), "/abc/i");
deepStrictEqual(String(wildcardPatternToRegex("abc", true, true)), "/^abc$/");

deepStrictEqual(String(wildcardPatternToRegex("a*bc", true, true)), "/^a.*bc$/");
deepStrictEqual(String(wildcardPatternToRegex("a**bc", true, true)), "/^a.*bc$/");
deepStrictEqual(String(wildcardPatternToRegex("a*?bc", true, true)), "/^a.+bc$/");
deepStrictEqual(String(wildcardPatternToRegex("a*??bc", true, true)), "/^a.{2,}bc$/");
deepStrictEqual(String(wildcardPatternToRegex("a??bc", true, true)), "/^a.{2}bc$/");
deepStrictEqual(String(wildcardPatternToRegex("a?*?bc", true, true)), "/^a.{2,}bc$/");
deepStrictEqual(String(wildcardPatternToRegex("a??*bc", true, true)), "/^a.{2,}bc$/");
deepStrictEqual(String(wildcardPatternToRegex("a??**bc", true, true)), "/^a.{2,}bc$/");
deepStrictEqual(String(wildcardPatternToRegex("??**", true, true)), "/^.{2,}$/");

deepStrictEqual(String(wildcardPatternToRegex("??")), "/.{2}/i");
deepStrictEqual(String(wildcardPatternToRegex("")), "/(?:)/i");
deepStrictEqual(String(wildcardPatternToRegex("", true, true)), "/^$/");

deepStrictEqual(String(wildcardPatternToRegex("()", true, true)), "/^\\(\\)$/");
deepStrictEqual(String(wildcardPatternToRegex("*()", true, true)), "/^.*\\(\\)$/");
deepStrictEqual(String(wildcardPatternToRegex("*(*)", true, true)), "/^.*\\(.*\\)$/");
deepStrictEqual(String(wildcardPatternToRegex("*(*)*", true, true)), "/^.*\\(.*\\).*$/");
deepStrictEqual(String(wildcardPatternToRegex("*([)*", true, true)), "/^.*\\(\\[\\).*$/");
deepStrictEqual(String(wildcardPatternToRegex("*([)]*", true, true)), "/^.*\\([)].*$/");

deepStrictEqual(wildcardPatternToRegex("*([)]*", true, true).test("()"), true);
deepStrictEqual(wildcardPatternToRegex("*([)]*", true, true).test("+()"), true);
deepStrictEqual(wildcardPatternToRegex("*([)a-z]*", true, true).test("+()"), true);
deepStrictEqual(wildcardPatternToRegex("*([)a-z]*", true, true).test("+(c"), true);
deepStrictEqual(wildcardPatternToRegex("*([)a-z]*", true, false).test("+(C"), true);
deepStrictEqual(wildcardPatternToRegex("*([)a-z]*", true, true).test("+(C"), false);

deepStrictEqual(wildcardPatternToRegex("*([)a-z]]*", true, true).test("+(}"), false);
deepStrictEqual(wildcardPatternToRegex("*([)a-z]]*", true, true).test("+()"), false);
deepStrictEqual(wildcardPatternToRegex("*([)a-z]]*", true, true).test("+()]"), true);
deepStrictEqual(wildcardPatternToRegex("*([)a-z]]*", true, true).test("+()]1"), true);

deepStrictEqual(String(wildcardPatternToRegex(" ")), "/ /i");
deepStrictEqual(wildcardPatternToRegex(" ", true, true).test(" "), true);
