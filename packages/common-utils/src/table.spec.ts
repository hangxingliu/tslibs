import { TablePrinter } from "./table.js";

const GREEN = "\u001B[32m";

{
  const table = new TablePrinter(["#", "Name", "Description"]);
  table.addRows([
    [1, "Test"],
    [2, "Test 2", "a quick"],
  ]);
  table.print();
}

{
  const table = new TablePrinter(["#", "Name", "Description"], { stringify: TablePrinter.COLORIZED_STRINGIFY });
  table.addRow([1, "Test"]);
  table.addRow([2, "Test 2", "a quick"], { color: GREEN });
  table.print();
}
