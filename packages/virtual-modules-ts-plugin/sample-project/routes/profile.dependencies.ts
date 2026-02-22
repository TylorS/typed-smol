import { Effect } from "effect";

/** Sibling dependencies: provided before route handler runs. */
export const dependencies = Effect.succeed({ profileService: "mock" as const });
