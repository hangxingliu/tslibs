import { expect, test, describe } from "bun:test";
import { resolveToolImplementation } from "./base.js";
import { callToolsForOpenAI } from "./openai.js";
import { callToolsForGoogle } from "./google.js";
import { callToolsForAnthropic } from "./anthropic.js";

function createTools() {
  const called: Array<{ name: string; args: any }> = [];
  const tools = {
    get_time: async (args: any) => {
      called.push({ name: "get_time", args });
    },
    fail: async () => {
      throw new Error("tool failed");
    },
  };
  return { tools, called };
}

describe("resolveToolImplementation", () => {
  test("should resolve an own function property", () => {
    const { tools } = createTools();
    expect(typeof resolveToolImplementation(tools, "get_time")).toBe("function");
  });

  test("should not resolve anything from the built-in prototypes", () => {
    const { tools } = createTools();
    for (const name of ["constructor", "toString", "hasOwnProperty", "__proto__"])
      expect(resolveToolImplementation(tools as any, name)).toBeUndefined();
  });

  test("should resolve a method defined in the class of the tools instance", () => {
    class BaseTools {
      async get_time() {}
    }
    class Tools extends BaseTools {
      async fail() {}
    }
    const tools = new Tools();
    expect(typeof resolveToolImplementation(tools as any, "get_time")).toBe("function");
    expect(typeof resolveToolImplementation(tools as any, "fail")).toBe("function");
    for (const name of ["constructor", "toString", "hasOwnProperty", "__proto__"])
      expect(resolveToolImplementation(tools as any, name)).toBeUndefined();
  });
});

describe("callToolsForOpenAI", () => {
  test("should call the requested function", async () => {
    const { tools, called } = createTools();
    const { errors } = await callToolsForOpenAI(
      {
        id: "resp-1",
        model: "test",
        choices: [
          {
            message: {
              tool_calls: [{ type: "function", id: "c1", function: { name: "get_time", arguments: '{"tz":"UTC"}' } }],
            },
          },
        ],
      } as any,
      tools
    );
    expect(errors).toEqual([]);
    expect(called).toEqual([{ name: "get_time", args: { tz: "UTC" } }]);
  });

  test("should collect the errors instead of throwing them", async () => {
    const { tools } = createTools();
    const { errors } = await callToolsForOpenAI(
      {
        id: "resp-1",
        model: "test",
        choices: [
          {
            message: {
              tool_calls: [
                { type: "function", id: "c1", function: { name: "fail", arguments: "{}" } },
                { type: "function", id: "c2", function: { name: "toString", arguments: "{}" } },
                { type: "function", id: "c3", function: { name: "get_time", arguments: "{" } },
              ],
            },
          },
        ],
      } as any,
      tools
    );
    expect(errors.length).toBe(3);
  });
});

describe("callToolsForGoogle", () => {
  test("should scan the candidates when the shortcut getter is empty", async () => {
    const { tools, called } = createTools();
    const { errors } = await callToolsForGoogle(
      {
        responseId: "resp-1",
        modelVersion: "test",
        functionCalls: [],
        candidates: [{ content: { parts: [{ functionCall: { id: "c1", name: "get_time", args: { tz: "UTC" } } }] } }],
      } as any,
      tools
    );
    expect(errors).toEqual([]);
    expect(called).toEqual([{ name: "get_time", args: { tz: "UTC" } }]);
  });

  test("should report an error when no function call is found", async () => {
    const { tools } = createTools();
    const { errors } = await callToolsForGoogle({ responseId: "resp-1", modelVersion: "test" } as any, tools);
    expect(errors.length).toBe(1);
  });
});

describe("callToolsForAnthropic", () => {
  test("should call the requested function", async () => {
    const { tools, called } = createTools();
    const { errors } = await callToolsForAnthropic(
      {
        id: "resp-1",
        model: "test",
        content: [
          { type: "text", text: "hi" },
          { type: "tool_use", id: "c1", name: "get_time", input: { tz: "UTC" } },
        ],
      } as any,
      tools
    );
    expect(errors).toEqual([]);
    expect(called).toEqual([{ name: "get_time", args: { tz: "UTC" } }]);
  });
});
