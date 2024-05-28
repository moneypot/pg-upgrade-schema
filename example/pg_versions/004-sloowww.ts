export default async function () {
  // this you should see a later upgrade time

  await sleep(1000);
  return "INSERT INTO chickens(name) VALUES('sleepy')";
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
