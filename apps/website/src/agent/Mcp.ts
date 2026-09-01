import { NodeHttpServerRequest } from "@effect/platform-node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Effect } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import * as z from "zod/v4";
import { documentationModel } from "../docs/Content.js";
import { generatedManifest } from "../generated/manifest.js";
import { operations } from "./Operations.js";

const result = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
});

const makeServer = () => {
  const server = new McpServer(
    { name: "typed-docs", version: "1.0.0" },
    {
      instructions:
        "Read-only documentation for Typed libraries. Stable symbol IDs are source provenance.",
    },
  );
  server.registerTool(
    "search_docs",
    {
      description: "Search Typed guides, glossary terms, and public symbols.",
      inputSchema: { query: z.string(), limit: z.number().int().min(1).max(50).optional() },
      annotations: { readOnlyHint: true },
    },
    async ({ query, limit }) => result(await operations.search(query, limit)),
  );
  server.registerTool(
    "get_symbol",
    {
      description: "Get one public symbol by stable ID.",
      inputSchema: { id: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => result((await operations.symbol(id)) ?? { error: "not_found" }),
  );
  server.registerTool(
    "get_guide",
    {
      description: "Get one conceptual guide by slug.",
      inputSchema: { slug: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ slug }) => result(operations.guide(slug) ?? { error: "not_found" }),
  );
  server.registerTool(
    "get_glossary_term",
    {
      description: "Resolve a canonical glossary ID, term, or alias.",
      inputSchema: { id: z.string() },
      annotations: { readOnlyHint: true },
    },
    async ({ id }) => result(operations.glossary(id) ?? { error: "not_found" }),
  );
  server.registerResource(
    "documentation-manifest",
    "typed://docs/manifest",
    { mimeType: "application/json" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({
            schemaVersion: documentationModel.schemaVersion,
            repositoryRevision: documentationModel.repositoryRevision,
            symbols: generatedManifest.routes
              .filter(({ kind }) => kind === "exposure")
              .map(({ id }) => id),
            guides: documentationModel.guides.map(({ slug }) => slug),
          }),
        },
      ],
    }),
  );
  server.registerResource(
    "glossary",
    "typed://docs/glossary",
    { mimeType: "application/json" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(documentationModel.glossary),
        },
      ],
    }),
  );
  return server;
};

export const handleMcp = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const incoming = NodeHttpServerRequest.toIncomingMessage(request);
  const response = NodeHttpServerRequest.toServerResponse(request);
  return yield* Effect.callback<HttpServerResponse.HttpServerResponse>((resume) => {
    const server = makeServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      response.off("finish", finish);
      response.off("close", finish);
      void transport.close();
      void server.close();
      resume(Effect.succeed(HttpServerResponse.empty({ status: response.statusCode })));
    };
    response.once("finish", finish);
    response.once("close", finish);
    void server
      .connect(transport)
      .then(() => transport.handleRequest(incoming, response))
      .catch((error) => {
        if (!response.headersSent)
          response.writeHead(500).end(
            JSON.stringify({
              jsonrpc: "2.0",
              id: null,
              error: { code: -32603, message: String(error) },
            }),
          );
        else finish();
      });
    return Effect.sync(() => {
      response.off("finish", finish);
      response.off("close", finish);
      void transport.close();
      void server.close();
    });
  });
});
