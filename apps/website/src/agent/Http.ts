import { Layer } from "effect";
import { ArtifactRoutes } from "./Artifacts.js";
import { ContentNegotiation } from "./ContentNegotiation.js";
import { DocumentationApiRoutes } from "./DocsApi.js";
import { McpRoutes } from "./McpRoutes.js";

export const AgentHttpRoutes = Layer.mergeAll(
  DocumentationApiRoutes,
  McpRoutes,
  ArtifactRoutes,
  ContentNegotiation,
);
