import { Effect } from "effect";
import { HttpRouter, HttpServerResponse } from "effect/unstable/http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { packageCatalog } from "../docs/Content.js";
import { documentationModel } from "../docs/Content.js";
import { recipes } from "../docs/Recipes.js";
import { generatedManifest } from "../generated/manifest.js";
import { canonicalSiteOrigin } from "../Site.js";

export const origin = canonicalSiteOrigin;

export const pageMarkdown: Readonly<Record<string, string>> = {
  "/": "# Cooperative by design\n\nFx models producer-driven work. Template turns that work into RenderEvent streams. Typed UI builds state and behavior on top while the DOM remains a shared integration boundary.\n",
  "/explore": `# Build up the system\n\nConcepts, guides, and deep dives follow Typed's Fx to Template to UI architecture.\n\n${documentationModel.guides
    .map((guide) => `- [${guide.title}](${origin}/explore/${guide.slug}): ${guide.summary}`)
    .join("\n")}\n`,
  ...Object.fromEntries(
    documentationModel.guides.map((guide) => [
      `/explore/${guide.slug}`,
      `# ${guide.title}\n\n${guide.summary}\n\n${guide.body}\n`,
    ]),
  ),
  "/integrate":
    "# Bring another renderer with you\n\nUse exact DOM nodes, trusted HTML, or a framework-owned host. Each recipe shows the real boundary in both directions and keeps cleanup with the renderer that created the output.\n",
  ...Object.fromEntries(
    recipes.map((recipe) => [
      `/integrate/${recipe.slug}`,
      `# ${recipe.title}\n\n${recipe.summary}\n\n${recipe.body}\n`,
    ]),
  ),
  "/reference": `# Reference\n\n${packageCatalog
    .map(
      (pkg) =>
        `- [${pkg.packageName}](${origin}/reference/packages/${encodeURIComponent(pkg.packageName)}): ${pkg.exposureCount} public exposures`,
    )
    .join("\n")}\n`,
  "/glossary": `# Glossary\n\n${documentationModel.glossary
    .map((entry) => `## ${entry.term}\n\n${entry.definition}\n\n${entry.details}`)
    .join("\n\n")}\n`,
};

const routeByPath = new Map(generatedManifest.routes.map((route) => [route.canonicalPath, route]));

export const loadMarkdownForPath = (pathname: string): Effect.Effect<string | undefined, never> => {
  const page = pageMarkdown[pathname];
  if (page !== undefined) return Effect.succeed(page);
  const markdownPath = routeByPath.get(pathname)?.markdownPath;
  if (markdownPath === undefined) return Effect.succeed(undefined);
  const root = import.meta.env.PROD
    ? new URL("../client/", import.meta.url)
    : new URL("../../public/", import.meta.url);
  return Effect.tryPromise(() =>
    readFile(fileURLToPath(new URL(`.${markdownPath}`, root)), "utf8"),
  ).pipe(Effect.catch(() => Effect.succeed(undefined)));
};

export const markdownPathForPath = (pathname: string): string | undefined =>
  routeByPath.get(pathname)?.markdownPath ??
  (Object.hasOwn(pageMarkdown, pathname)
    ? pathname === "/"
      ? "/index.md"
      : `${pathname}.md`
    : undefined);

const json = (body: unknown) => HttpServerResponse.jsonUnsafe(body);
const text = (body: string, contentType: string) =>
  HttpServerResponse.text(body, { headers: { "content-type": contentType } });

export const manifest = {
  schemaVersion: 1,
  repositoryRevision: documentationModel.repositoryRevision,
  canonical: origin,
  counts: generatedManifest.counts,
  routes: [
    ...Object.keys(pageMarkdown).map((canonicalPath) => ({
      kind: "page",
      id: `page:${canonicalPath}`,
      canonicalPath,
      markdownPath: canonicalPath === "/" ? "/index.md" : `${canonicalPath}.md`,
      jsonPath: null,
    })),
    ...generatedManifest.routes,
  ],
  api: `${origin}/api/docs/openapi.json`,
  mcp: `${origin}/mcp`,
  glossary: `${origin}/glossary`,
  schema: generatedManifest.schema,
};

const serverCard = {
  name: "Typed Documentation",
  description: "Read-only Typed library documentation",
  version: "1.0.0",
  transport: { type: "streamable-http", url: `${origin}/mcp` },
  tools: ["search_docs", "get_symbol", "get_guide", "get_glossary_term"],
  authentication: { required: false },
};

const apiCatalog = {
  name: "Typed documentation API",
  version: "1",
  baseUrl: `${origin}/api/docs`,
  openapi: `${origin}/api/docs/openapi.json`,
  schemas: [generatedManifest.schema],
};

const ard = {
  version: "1",
  name: "Typed",
  description: "Cooperative Effect-native UI infrastructure",
  resources: [
    { type: "documentation", url: `${origin}/docs-manifest.json` },
    { type: "api", url: `${origin}/api/docs/openapi.json` },
    { type: "mcp", url: `${origin}/mcp`, serverCard: `${origin}/.well-known/mcp.json` },
    { type: "schema", url: generatedManifest.schema },
  ],
};

export const ArtifactRoutes = HttpRouter.use(
  Effect.fn(function* (router) {
    yield* router.add("GET", "/.well-known/mcp.json", json(serverCard));
    yield* router.add("GET", "/.well-known/api-catalog", json(apiCatalog));
    yield* router.add("GET", "/.well-known/ard.json", json(ard));
    yield* router.add(
      "GET",
      "/.well-known/agent-skills/index.json",
      json({
        skills: [
          {
            name: "typed",
            description: "Build and verify with Typed libraries on Effect v4.",
            url: `${origin}/agent-skills/typed/SKILL.md`,
          },
        ],
      }),
    );
    yield* router.add("GET", "/docs-manifest.json", json(manifest));
    yield* router.add(
      "GET",
      "/llms.txt",
      text(
        `# Typed\n\n> Cooperative UI infrastructure built on Effect v4.\n\n- [Effect v4 documentation](https://www.effect.website/docs/v4)\n- [Explore](${origin}/explore.md)\n- [Integrate](${origin}/integrate.md)\n- [Reference](${origin}/reference.md)\n- [Glossary](${origin}/glossary.md)\n- [Documentation manifest](${origin}/docs-manifest.json)\n- [OpenAPI](${origin}/api/docs/openapi.json)\n- [Documentation JSON Schema](${generatedManifest.schema})\n- [MCP Server Card](${origin}/.well-known/mcp.json)\n`,
        "text/plain; charset=utf-8",
      ),
    );
    yield* router.add(
      "GET",
      "/llms-full.txt",
      text(
        `${Object.values(pageMarkdown).join("\n\n---\n\n")}\n\n---\n\n# API modules\n\n${generatedManifest.routes
          .filter(({ kind }) => kind === "module")
          .map(({ id }) => `- ${id.slice("module:".length)}`)
          .join("\n")}`,
        "text/plain; charset=utf-8",
      ),
    );
    yield* router.add(
      "GET",
      "/sitemap.xml",
      text(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
          ...Object.keys(pageMarkdown),
          ...generatedManifest.routes.map(({ canonicalPath }) => canonicalPath),
        ]
          .map((path) => `<url><loc>${origin}${path}</loc></url>`)
          .join("")}</urlset>`,
        "application/xml; charset=utf-8",
      ),
    );

    for (const [path, markdown] of Object.entries(pageMarkdown)) {
      const routePath = (path === "/" ? "/index.md" : `${path}.md`) as `/${string}`;
      yield* router.add("GET", routePath, text(markdown, "text/markdown; charset=utf-8"));
    }
  }),
);
