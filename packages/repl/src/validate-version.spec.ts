import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";

const src = "src";
describe("version", function () {
  it("# validate version", function () {
    const projectInfo = findProjectRoot();
    if (!projectInfo) throw new Error(`project root is not found!`);

    const { dir, pkg } = projectInfo;
    const { version } = JSON.parse(readFileSync(pkg, "utf-8"));
    console.log(`project version: ${version}`);

    const srcDir = resolve(dir, src);
    // const tsFiles = readdirSync(srcDir).filter((it) => !it.startsWith(".") && it.match(/\.ts$/i));
    const tsFiles = ["index.ts"];
    for (let i = 0; i < tsFiles.length; i++) {
      const tsFile = tsFiles[i];
      const code = readFileSync(resolve(srcDir, tsFile), "utf-8");
      const mtx = code.match(/@version\s+(\d+\.\d+\.\d+)\s*(.+?)$/m);
      if (!mtx) throw new Error(`no version info in file "${tsFile}"`);

      const matchedVer = mtx[1];
      console.log(`version: "${matchedVer} ${mtx[2]}" in file "${tsFile}"`);
      if (matchedVer !== version) if (!mtx) throw new Error(`version is incorrect in file "${tsFile}"`);
    }
  });
});

function findProjectRoot() {
  // let ptr = dirname(import.meta.dirname);
  let ptr = dirname(__dirname);
  const MAX_LEVEL = 3;
  for (let i = 0; i < MAX_LEVEL; i++) {
    const pkg = join(ptr, "package.json");
    if (existsSync(pkg)) return { dir: ptr, pkg };
    ptr = dirname(ptr);
  }
}
