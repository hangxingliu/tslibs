import { deepStrictEqual } from "node:assert";
import { parseUnixEscapeSeq } from "./shell-args-escape.js";

deepStrictEqual(parseUnixEscapeSeq("\\n").toString("hex"), Buffer.from("\n").toString("hex"));
deepStrictEqual(parseUnixEscapeSeq("\\xe4\\xbd\\xa0\\xe5\\xa5\\xbd").toString("utf-8"), "你好");
