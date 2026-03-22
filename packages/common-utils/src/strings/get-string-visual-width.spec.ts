import { getStringVisualWidth } from "./get-string-visual-width.js";

const testStrings = [
  { label: "ASCII", value: "Hello" }, // Expected: 5
  { label: "CJK", value: "你好" }, // Expected: 4
  { label: "Emoji Simple", value: "🍎" }, // Expected: 2
  { label: "Emoji ZWJ (Family)", value: "👨‍👩‍👧‍👦" }, // Expected: 2 (visually one block)
  { label: "Mixed", value: "Hi, 世界! 🌍" }, // Expected: 3 + 1 + 4 + 2 + 2 = 12
];

console.log("--- String Width Calculation ---");
testStrings.forEach(({ label, value }) => {
  console.log(`[${label}] "${value}": ${getStringVisualWidth(value)}`);
});
