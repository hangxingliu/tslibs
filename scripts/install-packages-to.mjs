#!/usr/bin/env node
/// <reference types="node" />
//@ts-check
if (!process.version || /^v([1-9]|1[1-9])\./.test(process.version))
  throw new Error(`Unsupported Node.js version: ${process.version}`);

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as util from "node:util";
import { existsSync } from "node:fs";

const VERSION = "2026-02-01";
const BIN_NAME = path.basename(import.meta.filename);
const USAGE = [
  "",
  `  Usage: ${BIN_NAME} [...options] <target-dir> [...package-names]`,
  "",
  "  Options:",
  "",
  "    -l, --list                   List all available packages",
  "       --src <path-to-lib-dir>   The path of my typescript library directory (env: LOCAL_TS_LIBS_DIR)",
  "       --no-env                  Disable loading .env file",
  "       --org <org-name>          The org name for target packages",
  "       --cjs                     Force to set type to 'commonjs'",
  "       --esm                     Force to set type to 'module'",
  "",
  "",
];

//
// #region configs
const COMMON_PROJECT_FILES = [".prettierrc", ".editorconfig"];
const IGNORED_PKGS = new Set(["template", "playground"]);
/** @type {Array<string|RegExp>} */
const IGNORED_SYNC_PATTERN = [
  /^\._/,
  ".DS_Store",
  /\.tsbuildinfo$/,
  /\.log$/,
  /\.(?:spec|test)\.ts$/,
  // ignored files
  "node_modules",
  "tests",
  "eslint.config.mjs",
  "rollup.config.mjs",
];
// #endregion configs
//

function showVersion() {
  console.log(`${BIN_NAME} ${VERSION}`);
  return process.exit(0);
}
function showUsage() {
  console.log(USAGE.join("\n"));
  return process.exit(0);
}

/** @typedef {{name: string, path: string}} PackageRef */

/**
 * @param {string} baseDir
 */
async function getAllAvailablePackages(baseDir) {
  const items = await fs.readdir(baseDir, { withFileTypes: true });
  /** @type {PackageRef[]} */
  const result = [];
  for (const it of items) {
    if (!it.isDirectory()) continue;
    if (it.name.startsWith(".")) continue;
    if (IGNORED_PKGS.has(it.name)) continue;
    result.push({ name: it.name, path: path.resolve(baseDir, it.name) });
  }
  return result;
}

/**
 * @param {string} fileName
 */
function isIgnoredFileName(fileName) {
  for (const pattern of IGNORED_SYNC_PATTERN)
    if (typeof pattern === "string" ? pattern === fileName : pattern.test(fileName)) return true;
  return false;
}

/**
 * @param {string} absPath
 * @param {string|null} relPath
 * @param {Set<string>} fileSet
 * @param {Set<string>} dirSet
 */
async function scanDir(absPath, relPath, fileSet, dirSet) {
  const currentSrcDir = relPath ? path.resolve(absPath, relPath) : absPath;
  const entries = await fs.readdir(currentSrcDir, { withFileTypes: true });
  if (relPath) dirSet.add(relPath);
  for (const entry of entries) {
    if (isIgnoredFileName(entry.name)) continue;
    const entryRelativePath = relPath ? path.join(relPath, entry.name) : entry.name;
    if (entry.isDirectory()) {
      dirSet.add(entryRelativePath);
      await scanDir(absPath, entryRelativePath, fileSet, dirSet);
    } else if (entry.isFile()) {
      fileSet.add(entryRelativePath);
    }
  }
}

/**
 * @param {string} srcDir
 * @param {string} targetDir
 */
function copyCommonProjectFiles(srcDir, targetDir) {
  return Promise.all(
    COMMON_PROJECT_FILES.map((name) => fs.copyFile(path.join(srcDir, name), path.join(targetDir, name)))
  );
}

/**
 * @param {PackageRef} pkgSrc
 * @param {string} targetDir
 */
async function copyPackage(pkgSrc, targetDir) {
  const srcDirSet = new Set();
  const srcFileSet = new Set();
  await scanDir(pkgSrc.path, null, srcFileSet, srcDirSet);

  const targetDirSet = new Set();
  const targetFileSet = new Set();
  await scanDir(targetDir, null, targetFileSet, targetDirSet);

  const promises = [];
  for (const srcDir of srcDirSet) {
    if (targetDirSet.has(srcDir)) continue;
    promises.push(fs.mkdir(path.join(targetDir, srcDir), { recursive: true }));
  }
  const createdDirs = promises.length;
  await Promise.all(promises);

  promises.length = 0;
  for (const srcFile of srcFileSet) {
    promises.push(fs.copyFile(path.join(pkgSrc.path, srcFile), path.join(targetDir, srcFile)));
    targetFileSet.delete(srcFile);
  }
  const copiedFiles = promises.length;
  await Promise.all(promises);

  promises.length = 0;
  for (const commonFile of COMMON_PROJECT_FILES) targetFileSet.delete(commonFile);
  for (const targetFile of targetFileSet) promises.push(fs.unlink(path.join(targetDir, targetFile)));
  const deletedFiles = promises.length;
  await Promise.all(promises);

  let statText = `updated '${path.relative(process.cwd(), targetDir)}':`;
  if (createdDirs) statText += ` created ${createdDirs} dirs`;
  if (copiedFiles) statText += ` copied ${copiedFiles} files`;
  if (deletedFiles) statText += ` deleted ${deletedFiles} files`;
  process.stderr.write(statText + "\n");
}

/**
 * @param {string} targetDir
 * @param {string|null} namespace
 * @param {"module"|"commonjs"|null} forceModuleType
 */
async function updatePackageJSON(targetDir, namespace, forceModuleType) {
  const pkgJSONFile = path.resolve(targetDir, "package.json");
  const pkgJSON = JSON.parse(await fs.readFile(pkgJSONFile, "utf-8"));
  if (typeof namespace === "string") {
    const pkgBaseName = String(pkgJSON.name || "").replace(/^@[^\/]+\//, "");
    pkgJSON.name = namespace ? `${namespace}/${pkgBaseName}`.replace(/^@?/, "@") : pkgBaseName;
  }
  delete pkgJSON.scripts;
  delete pkgJSON.devDependencies;
  if (forceModuleType) {
    pkgJSON.type = forceModuleType;
    let deleteExportKey = "require";
    let deletePkgKey = "main";
    /** @type {[string, string]} */
    let typesRewrite = ["cjs", "esm"];
    if (forceModuleType === "commonjs") {
      deletePkgKey = "module";
      deleteExportKey = "import";
      typesRewrite = ["esm", "cjs"];
    }
    const handleExportsObject = (/** @type {any} */ it) => {
      delete it[deleteExportKey];
      if (typeof it.types === "string") it.types = it.types.replace(typesRewrite[0], typesRewrite[1]);
    };
    delete pkgJSON[deletePkgKey];
    if (pkgJSON.exports && typeof pkgJSON.exports === "object") {
      for (const item of Object.values(pkgJSON.exports)) {
        if (Array.isArray(item)) {
          for (const it of item) if (it && typeof it === "object") handleExportsObject(it);
        } else if (typeof item === "object") {
          handleExportsObject(item);
        }
      }
      //
    }
  }

  await fs.writeFile(pkgJSONFile, JSON.stringify(pkgJSON, null, 2) + "\n");
}

/**
 * @param {string} targetDir
 * @param {"module"|"commonjs"|null} forceModuleType
 */
async function updateGitIgnore(targetDir, forceModuleType) {
  const gitIgnoreFile = path.resolve(targetDir, ".gitignore");
  if (!existsSync(gitIgnoreFile)) return;
  const SEP = "\n";
  const gitIgnore = (await fs.readFile(gitIgnoreFile, "utf-8")).split(SEP);
  let filter = /^(?:cjs|esm)\s*$/;
  if (forceModuleType === "commonjs") filter = /^(?:cjs)\s*$/;
  else if (forceModuleType === "module") filter = /^(?:esm)\s*$/;

  let removed = false;
  for (let i = 0; i < gitIgnore.length; i++) {
    if (filter.exec(gitIgnore[i])) {
      removed = true;
      gitIgnore.splice(i, 1);
      i--;
    }
  }
  if (removed) await fs.writeFile(gitIgnoreFile, gitIgnore.join(SEP));
}

async function main() {
  const { values: options, positionals: _args } = util.parseArgs({
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "V" },
      list: { type: "boolean", short: "l" },
      "no-env": { type: "boolean" },
      src: { type: "string", multiple: false },
      org: { type: "string", multiple: false },
      cjs: { type: "boolean" },
      esm: { type: "boolean" },
    },
    allowPositionals: true,
    allowNegative: false,
  });
  if (options.version) return showVersion();
  if (options.help) return showUsage();

  const forceModuleType = options.esm === true ? "module" : options.cjs === true ? "commonjs" : null;
  const pkgOrgName = options.org || null;

  const [targetDir, ..._inputPkgNames] = _args;
  if (!targetDir && !options.list) return showUsage();

  let projectSourceDir = options.src || process.env.LOCAL_TS_LIBS_DIR;
  const envFile = path.resolve(process.cwd(), ".env");
  if (existsSync(envFile)) {
    try {
      /** @type {any} */
      const env = util.parseEnv(await fs.readFile(envFile, "utf-8"));
      if (env.LOCAL_TS_LIBS_DIR && !projectSourceDir) projectSourceDir = path.resolve(process.cwd(), env.LOCAL_TS_LIBS_DIR);
    } catch (/** @type {any} */ error) {
      process.stderr.write(`warn: failed to load .env file: ${error.message}\n`);
    }
  }

  if (!projectSourceDir) throw `Error: please provide --src or env var LOCAL_TS_LIBS_DIR for updating`;
  if (!existsSync(projectSourceDir)) throw `Error: The source path "${projectSourceDir}" doesn't exist`;

  const packagesSourceDir = path.resolve(projectSourceDir, "packages");
  const allPkgs = await getAllAvailablePackages(packagesSourceDir);
  const allPkgsMap = new Map(allPkgs.map((it) => [it.name, it]));
  if (options.list) {
    console.log(allPkgs.map((it) => it.name).join("\n"));
    return;
  }

  /** @type {PackageRef[]} */
  let existedPkgs = [];
  if (existsSync(targetDir)) {
    existedPkgs = await getAllAvailablePackages(targetDir);
  } else {
    await fs.mkdir(targetDir, { recursive: true });
    process.stderr.write(`info: created '${targetDir}'\n`);
  }

  /** @type {PackageRef[]} */
  const updatePkgs = [];
  if (_inputPkgNames.length === 0) {
    for (const pkg of existedPkgs) {
      const pkgSrc = allPkgsMap.get(pkg.name);
      if (!pkgSrc) {
        process.stderr.write(`warn: unknown package: "${pkg.path}"\n`);
        continue;
      }
      updatePkgs.push(pkgSrc);
    }
  } else {
    for (const pkgName of _inputPkgNames) {
      const pkgSrc = allPkgsMap.get(pkgName);
      if (!pkgSrc) throw `Error: unknown package name "${pkgName}"`;
      updatePkgs.push(pkgSrc);
    }
  }

  for (const pkgSrc of updatePkgs) {
    const pkgTarget = path.resolve(targetDir, pkgSrc.name);
    if (!existsSync(pkgTarget)) await fs.mkdir(pkgTarget, { recursive: true });

    await copyCommonProjectFiles(projectSourceDir, pkgTarget);
    await copyPackage(pkgSrc, pkgTarget);
    await updatePackageJSON(pkgTarget, pkgOrgName, forceModuleType);
    await updateGitIgnore(pkgTarget, forceModuleType);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
