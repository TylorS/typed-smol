import type { TypedConfig } from "@typed/app";

export default {
  entry: "packages/app/src/entry.server.ts",
  router: { prefix: "router:" },
  api: { prefix: "api:", pathPrefix: "/api" },
} satisfies TypedConfig;
