import { Client } from "pg";

export default async function (pg: Client) {
  await pg.query("INSERT INTO chickens(name) VALUES($1)", ["sally"]);

  return "INSERT INTO chickens(name) VALUES('suzy')"; // this also gets executed
}
