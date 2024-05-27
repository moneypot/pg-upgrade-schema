import { Client as PgClient } from "pg";
import * as pgupgradeschema from "../src";

import versions from "./pg_versions/index";

async function main() {
  console.log("This is the example app");

  const client = new PgClient({ database: "example" });

  await client.connect();

  await pgupgradeschema.ensure(client, versions);

  await client.end();
}

main();
