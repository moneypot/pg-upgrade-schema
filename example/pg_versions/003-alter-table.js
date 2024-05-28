export default async function (pg) {
  let tableName = "chickens";
  return "ALTER TABLE " + tableName + " ADD sex CHAR DEFAULT 'f' ";
}
