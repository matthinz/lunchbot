import { config } from "dotenv";
import { createApp } from "./app";
import { AppOptionsSchema } from "./schemas";

config();

run().catch((err) => {
  process.exitCode = 1;
  console.error(err);
});

async function run() {
  const options = AppOptionsSchema.parse(process.env);

  const app = createApp(options);

  await app.start();

  console.log("Listening on port %d", options.port);
}
