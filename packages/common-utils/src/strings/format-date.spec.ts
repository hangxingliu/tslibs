import { afterNow, formatDate } from "./format-date.js";

console.log(formatDate("yyyymmdd/HHMMSS.txt"));

const date1 = new Date();
const date2 = new Date(date1);
date2.setHours(date1.getHours() + 1);

console.log(afterNow(date2, date1));
