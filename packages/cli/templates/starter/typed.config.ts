import { defineConfig } from "@typed/app";

export default defineConfig({
  entry: "packages/app/src/entry.server.ts",
  router: { prefix: "router:" },
  api: { prefix: "api:", pathPrefix: "/api" },
});
