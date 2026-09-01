import { Effect } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { handleMcp } from "./Mcp.js";

export const McpRoutes = HttpRouter.use(
  Effect.fn(function* (router) {
    yield* router.add("POST", "/mcp", handleMcp);
  }),
);
