import { getFileSHA } from "./hash.js";

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
async function main() {
  const sha256 = await getFileSHA(import.meta.filename, "hex", "sha256");
  console.log(sha256);

  const buf = await getFileSHA(import.meta.filename, null);
  console.log(buf.toString("hex"));
}
