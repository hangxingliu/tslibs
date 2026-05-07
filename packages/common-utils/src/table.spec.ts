import { expect, test, describe } from "bun:test";
import { TablePrinter } from "./table.js";

const GREEN = "\u001B[32m";

describe("TablePrinter", () => {
  test("basic table", () => {
    const table = new TablePrinter(["#", "Name", "Description"]);
    table.addRows([
      [1, "Test"],
      [2, "Test 2", "a quick"],
    ]);
    const lines = table.toString();
    expect(lines).toHaveLength(4); // header, boundary, row 1, row 2
    expect(lines[0]).toBe("#   Name     Description");
    expect(lines[1]).toBe("------------------------");
    expect(lines[2]).toBe("1   Test                ");
    expect(lines[3]).toBe("2   Test 2   a quick    ");
  });

  test("colorized table", () => {
    const table = new TablePrinter(["#", "Name", "Description"], {
      stringify: TablePrinter.COLORIZED_STRINGIFY,
    });
    table.addRow([1, "Test"]);
    table.addRow([2, "Test 2", "a quick"], { color: GREEN });
    const lines = table.toString();
    expect(lines).toHaveLength(4);
    expect(lines[2]).toBe("1   Test                ");
    expect(lines[3]).toBe(GREEN + "2   Test 2   a quick    " + "\x1b[0m");
  });
});
