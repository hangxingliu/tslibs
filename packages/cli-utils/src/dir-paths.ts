/**! --------------------------------------------------------------------------------------
 *   Copyright (c) Liu Yue @hangxingliu. All rights reserved.
 *   Licensed under the MIT License. Details in `LICENSE` file in the project root.
 *   Authors:  Liu Yue <hangxingliu@gmail.com>
 *   ORCID:    https://orcid.org/0009-0007-6518-185X
 *   --------------------------------------------------------------------------------------   */
import { statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

export function getPackageJsonDir(baseDir: string, maxDepth = 4, preferMonoRepo = true) {
  let currDir = baseDir;
  let resolvedDir: string | undefined;
  do {
    let st = statSync(currDir);
    if (!st.isDirectory()) throw new Error(`'${currDir}' is not a directory`);

    const pkgFile = resolve(currDir, "package.json");
    try {
      st = statSync(pkgFile);
      if (st.isFile()) {
        if (typeof resolvedDir === "string" || !preferMonoRepo) return currDir;
        resolvedDir = currDir;
      }
    } catch {
      // noop
    }
    const nextDir = resolve(currDir, "..");
    if (nextDir === currDir) break;
    currDir = nextDir;
  } while (maxDepth-- >= 0);

  if (typeof resolvedDir === "string") return resolvedDir;
  throw new Error(`Failed to resolve the package directory from '${baseDir}'`);
}

//
// https://github.com/codingjerk/appdirsjs/blob/master/src/index.ts
//
export type AppDirPaths = {
  readonly cache: string;
  readonly config: string;
  readonly data: string;
};

export function getAppDirPaths(appName: string): AppDirPaths {
  if (process.platform === "win32") return getWindowsAppDirPaths(appName);
  if (process.platform === "darwin") return getMacOSAppDirPaths(appName);
  return getLinuxAppDirPaths(appName);
}
function getWindowsAppDirPaths(appName: string): AppDirPaths {
  const home = homedir();
  const appData = resolve(home, "AppData");
  const roamingAppData = process.env.APPDATA || resolve(appData, "Roaming");
  const localAppData = process.env.LOCALAPPDATA || resolve(appData, "Local");
  return Object.freeze({
    cache: resolve(localAppData, "Temp", appName),
    config: resolve(roamingAppData, appName),
    data: resolve(localAppData, appName),
  });
}
function getLinuxAppDirPaths(appName: string): AppDirPaths {
  const home = homedir();
  return Object.freeze({
    cache: resolve(process.env.XDG_CACHE_HOME || resolve(home, ".cache"), appName),
    config: resolve(process.env.XDG_CONFIG_HOME || resolve(home, ".config"), appName),
    data: resolve(process.env.XDG_DATA_HOME || resolve(home, ".local", "share"), appName),
  });
}
function getMacOSAppDirPaths(appName: string): AppDirPaths {
  const home = homedir();
  return Object.freeze({
    cache: resolve(home, "Library", "Caches", appName),
    config: resolve(home, "Library", "Preferences", appName),
    data: resolve(home, "Library", "Application Support", appName),
  });
}
