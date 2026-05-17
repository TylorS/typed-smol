import { Effect } from "effect";
import { RealWorldConfig } from "../src/infrastructure/Config.js";
import {
  migrateDatabase,
  resetDatabase,
  seedConfiguredDatabase,
} from "../src/infrastructure/Reset.js";

const command = process.argv[2];

const program = (() => {
  switch (command) {
    case "migrate":
      return migrateDatabase;
    case "seed":
      return seedConfiguredDatabase;
    case "reset":
      return resetDatabase;
    default:
      return Effect.die(new Error(`Unknown db command: ${command ?? "<missing>"}`));
  }
})();

Effect.runPromise(Effect.provide(program, RealWorldConfig.Live)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
