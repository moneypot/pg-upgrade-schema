import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Client as PgClient } from "pg";
import { default as debugImport } from "debug";

const debug = debugImport("pg-upgrade-schema:read-directory");

type UpgradeScript =
  | string
  | ((pgClient: PgClient) => void | string | Promise<void | string>);

export async function readDirectory(dirPath: string) {
  debug("Opening directory: ", dirPath);
  const files = await fs.readdir(dirPath, { withFileTypes: true });

  const filesVersionsPaths = new Map<number, () => Promise<UpgradeScript>>();

  for (const file of files) {
    if (!file.isFile()) {
      throw new Error(
        `Directory ${dirPath} should only be full of files, found ${file}`
      );
    }

    const startNum = Number.parseInt(file.name);

    if (!Number.isSafeInteger(startNum) || startNum <= 0) {
      throw new Error(`${file.name} does not start with a positive integer`);
    }
    if (filesVersionsPaths.has(startNum)) {
      throw new Error(
        `${file.name} starts with ${startNum} but so does another file too`
      );
    }

    let f: () => Promise<UpgradeScript>;

    if (file.name.endsWith(".sql")) {
      const p = path.join(file.parentPath, file.name);

      debug("going to read sql ", p);
      f = () =>
        fs.readFile(p, {
          encoding: "utf8",
        });
    } else if (file.name.endsWith(".ts") || file.name.endsWith(".js")) {
      const p = "file:" + path.join(file.parentPath, file.name);
      debug("Going to import: ", p);
      f = () => import(p).then((x) => x.default);
    } else {
      throw new Error(`unrecognized filetype: ${file.name}`);
    }

    filesVersionsPaths.set(startNum, f);
  }

  for (let i = 1; i <= files.length; i++) {
    if (!filesVersionsPaths.has(i)) {
      throw new Error(
        `Was expecting a file to start with ${i} but didn't find it`
      );
    }
  }

  return filesVersionsPaths;
}
