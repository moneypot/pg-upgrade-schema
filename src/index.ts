import { default as debugImport } from "debug";
import type { Client as PgClient } from "pg";
import { assert } from "tsafe";
import { readDirectory } from "./read-directory";
export { readDirectory } from "./read-directory";

interface Versions {
  [key: number]:
    | string
    | ((pgClient: PgClient) => void | string | Promise<void | string>);
}

const debug = debugImport("pg-upgrade-schema");

export default async function (
  client: PgClient,
  dirname: string,
  versionTableName: string = "pg_upgrade_schema_versions" // note: this doesn't ever get sql escaped
) {
  const versions = await readDirectory(dirname);
  debug("ensure called, making sure we can query");

  const res = await client.query("SELECT version()");
  assert(res.rowCount == 1);
  debug("Connected to postgres: ", res.rows[0].version);

  // Get a lock so this doesn't happen on multiple instances at the same time
  await withLock(client, async (client) => {
    let version = -1;
    try {
      const res = await client.query(
        `SELECT version FROM ${versionTableName} ORDER BY version DESC LIMIT 1`
      );
      assert(res.rows.length == 1);
      version = res.rows[0].version;
    } catch (err: any) {
      if (err.code === "42P01") {
        console.warn(
          `Could not detect table "${versionTableName}" table, creating it`
        );
        await createVersionTable(client, versionTableName);
        version = 0;
      } else {
        throw err;
      }
    }
    assert(version >= 0);
    console.log("Currently on pg-upgrade-schema version: ", version);

    const maxVersion = versions.size;

    if (version > maxVersion) {
      throw new Error(
        `Our database is on version ${version} but we are only aware of how to upgrade to ${maxVersion} (i.e. the database is ahead of the code)`
      );
    }

    for (let i = version + 1; i <= maxVersion; i++) {
      console.log("About to apply upgrade: ", i);

      try {
        await client.query(`BEGIN`);
        const upgrade = await versions.get(i)();

        let ret;

        if (typeof upgrade == "string") {
          ret = await client.query(upgrade);
        } else if (typeof upgrade == "function") {
          ret = await upgrade(client);
          if (typeof ret === "string") {
            ret = await client.query(ret);
          }
        } else {
          throw new Error(`unknown upgrade script in version ${i}`);
        }

        debug("After upgrade ", i, " got result ", ret ? ret.rows : "<void>");

        await client.query(
          `INSERT INTO ${versionTableName}(version) VALUES($1)`,
          [i]
        );
        await client.query(`COMMIT`);

        debug("Upgraded to: ", i);
      } catch (err) {
        console.error(
          "When trying to upgrade to version: ",
          i,
          " caught error ",
          err
        );
        throw err;
      }
    }
  });
}

async function createVersionTable(client: PgClient, versionTableName: string) {
  debug("trying to create");
  await client.query(`
    BEGIN;
    CREATE TABLE ${versionTableName}(
      version     int           NOT NULL PRIMARY KEY,
      updated_at  timestamptz   NOT NULL DEFAULT clock_timestamp()
    );
    INSERT INTO ${versionTableName}(version) VALUES(0);
    COMMIT;
  `);
  debug("created table ", versionTableName);
}

async function withLock(client: PgClient, f: (client: PgClient) => void) {
  const MAGIC_LOCK_NUMBER = 5318008;
  debug("getting pg_advisory_lock");
  await client.query("SELECT pg_advisory_lock($1)", [MAGIC_LOCK_NUMBER]);

  try {
    await f(client);
  } finally {
    debug("releasing pg_advisory_lock");
    await client.query("SELECT pg_advisory_unlock($1)", [MAGIC_LOCK_NUMBER]);
  }
}
