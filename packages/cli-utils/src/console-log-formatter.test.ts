import { COLORS_ALL } from "./colors/index.js";
import { ConsoleLogFormatter } from "./console-log-formatter.js";

const logger = new ConsoleLogFormatter("", COLORS_ALL.BOLD);
logger.add('wrote "{}"', ["test file"]);
logger.print();
