import { deepStrictEqual } from "node:assert";
import { splitShellArgs } from "./shell-args-split.js";

deepStrictEqual(splitShellArgs(""), []);
deepStrictEqual(splitShellArgs("echo"), ["echo"]);
deepStrictEqual(splitShellArgs("\\"), ["\\"]);
deepStrictEqual(splitShellArgs("\\'"), ["'"]);
deepStrictEqual(splitShellArgs('\\"'), ['"']);
deepStrictEqual(splitShellArgs("git ls-files"), ["git", "ls-files"]);
deepStrictEqual(splitShellArgs('"git" ls-files'), ["git", "ls-files"]);
deepStrictEqual(splitShellArgs("'git' ls-files 'sp ace'"), ["git", "ls-files", "sp ace"]);
deepStrictEqual(splitShellArgs("'git' ls-files 'sp ace\\'"), ["git", "ls-files", "sp ace\\"]);
deepStrictEqual(splitShellArgs("'git' ls-files ''"), ["git", "ls-files", ""]);

// deepStrictEqual(splitShellArgs("\\xe4\\xbd\\xa0\\xe5\\xa5\\xbd").toString("utf-8"), "你好");
