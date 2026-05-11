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

  test("multi-line table", () => {
    const table = new TablePrinter(["ID", "Tags"]);
    table.addRow([1, ["tag1", "tag2"]]);
    table.addRow([2, "tag3"]);
    const lines = table.toString();
    expect(lines).toHaveLength(5); // header, boundary, row 1 (line 1), row 1 (line 2), row 2
    expect(lines[0]).toBe("ID   Tags");
    expect(lines[1]).toBe("---------");
    expect(lines[2]).toBe("1    tag1");
    expect(lines[3]).toBe("     tag2");
    expect(lines[4]).toBe("2    tag3");
  });

  test("multi-line table with multiple columns", () => {
    const table = new TablePrinter(["Name", "Details"]);
    table.addRow([
      ["Line 1", "Line 2"],
      ["Detail A", "Detail B", "Detail C"],
    ]);
    const lines = table.toString();
    expect(lines).toHaveLength(5); // header, boundary, line 1, line 2, line 3
    expect(lines[2]).toBe("Line 1   Detail A");
    expect(lines[3]).toBe("Line 2   Detail B");
    expect(lines[4]).toBe("         Detail C");
  });
});
