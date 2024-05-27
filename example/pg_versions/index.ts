import fs from "fs";
import path from "path";
import { Client as PgClient } from "pg";

function readFile(f: string) {
  return fs.readFileSync(path.join(__dirname, f), "utf-8");
}

export default {
  1: readFile("001-create-v1table.sql"),
  2: require("./002-insert-some-stuff").default,
  3: readFile("003-do-nothing.sql"),
  4: async function (pgClient: PgClient) {
    await pgClient.query("select 444444");
    return "select 'lol'"; // this also gets run
  },
  5: function () {
    return "SELECT " + "777";
  },
};
