#!/usr/bin/env node
//@ts-check

import { readFile, copyFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const rootDir = resolve(import.meta.dirname, ".."); // Assuming scripts/copy-licenses.mjs is in the scripts directory
const LICENSES_DIR_NAME = "scripts/licenses"; // Directory containing license files (e.g., MIT.txt, ISC.txt)
const DESTINATION_LICENSE_FILE_NAME = "LICENSE"; // The name of the license file in each sub-package

/**
 * Resolves workspace paths from a list of workspace patterns.
 * Handles glob patterns like "packages/*" by reading directories.
 *
 * @param {string[]} workspaces - An array of workspace patterns from package.json.
 * @returns {Promise<string[]>} A promise that resolves to an array of absolute paths to workspaces.
 */
async function getWorkspacePaths(workspaces) {
  const resolvedPaths = [];
  for (const workspacePattern of workspaces) {
    if (workspacePattern.endsWith("/*")) {
      const baseDir = resolve(rootDir, workspacePattern.slice(0, -2)); // Remove '/*' from the pattern
      try {
        const entries = await readdir(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            resolvedPaths.push(join(baseDir, entry.name));
          }
        }
      } catch (error) {
        console.warn(
          `Warning: Could not read directory for workspace pattern "${workspacePattern}" at "${baseDir}": ${error.message}`
        );
      }
    } else {
      resolvedPaths.push(resolve(rootDir, workspacePattern));
    }
  }
  return resolvedPaths;
}

async function main() {
  try {
    const rootPackageJsonPath = join(rootDir, "package.json");
    const rootPackageJsonContent = await readFile(rootPackageJsonPath, "utf-8");
    const rootPackageJson = JSON.parse(rootPackageJsonContent);

    const { workspaces } = rootPackageJson;

    if (!workspaces || workspaces.length === 0) {
      console.log("No workspaces found in package.json. Exiting.");
      return;
    }

    const resolvedWorkspacePaths = await getWorkspacePaths(workspaces);
    const licensesDir = join(rootDir, LICENSES_DIR_NAME);

    for (const workspacePath of resolvedWorkspacePaths) {
      const subPackageJsonPath = join(workspacePath, "package.json");

      try {
        const subPackageJsonContent = await readFile(subPackageJsonPath, "utf-8");
        const subPackageJson = JSON.parse(subPackageJsonContent);
        const licenseType = subPackageJson.license;

        if (!licenseType) {
          console.warn(`Warning: No "license" field found in "${subPackageJsonPath}". Skipping.`);
          continue;
        }

        // Normalize license type to match file naming convention (e.g., "MIT" -> "mit.txt")
        const sourceLicenseFileName = `${licenseType.toLowerCase()}.txt`;
        const sourceLicensePath = join(licensesDir, sourceLicenseFileName);
        const destinationLicensePath = join(workspacePath, DESTINATION_LICENSE_FILE_NAME);

        try {
          await copyFile(sourceLicensePath, destinationLicensePath);
          console.log(`Copied "${sourceLicenseFileName}" to "${destinationLicensePath}"`);
        } catch (copyError) {
          console.error(
            `Error copying license for workspace "${workspacePath}" from "${sourceLicensePath}": ${copyError.message}`
          );
        }
      } catch (subPackageError) {
        // This catch block handles errors like package.json not found or invalid JSON
        console.error(
          `Error processing workspace at "${workspacePath}" (package.json: "${subPackageJsonPath}"): ${subPackageError.message}`
        );
      }
    }
  } catch (error) {
    // This catch block handles errors like root package.json not found or invalid JSON
    console.error("An unrecoverable error occurred:", error.message);
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
}

main();
