import { Client as PgClient } from "pg";
import pgupgradeschema from "../src";

async function main() {
  console.log("This is the example app");

  const client = new PgClient({ database: "example" });

  await client.connect();

  await pgupgradeschema(client, __dirname + "/pg_versions");

  await client.end();
}

main();
