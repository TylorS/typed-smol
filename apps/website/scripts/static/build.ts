import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import * as fs from "node:fs/promises";
import * as net from "node:net";
import * as path from "node:path";
import {
  manifest as artifactManifest,
  markdownPathForPath,
  origin,
} from "../../src/agent/Artifacts.js";

const websiteRoot = path.resolve(import.meta.dirname, "../..");
const clientRoot = path.join(websiteRoot, "dist/client");
const serverEntry = path.join(websiteRoot, "dist/server/server.js");
const siteRoot = path.join(websiteRoot, "dist/site");
const siteBase = normalizeBase(process.env.SITE_BASE ?? "/");

const routeByPath = new Map(artifactManifest.routes.map((route) => [route.canonicalPath, route]));
const routes = [...new Set(artifactManifest.routes.map(({ canonicalPath }) => canonicalPath))];
const artifactPaths = [
  "/.well-known/mcp.json",
  "/.well-known/api-catalog",
  "/.well-known/ard.json",
  "/.well-known/agent-skills/index.json",
  "/docs-manifest.json",
  "/llms.txt",
  "/llms-full.txt",
  "/sitemap.xml",
  "/api/docs/openapi.json",
  ...artifactManifest.routes
    .filter(({ kind }) => kind === "page")
    .flatMap(({ canonicalPath }) => {
      const markdownPath = markdownPathForPath(canonicalPath);
      return markdownPath === undefined ? [] : [markdownPath];
    }),
];

const clientEntryUrl = await copyStaticAssets();
await rewriteSearchLinks();

const port = await availablePort();
const server = spawn(process.execPath, [serverEntry, "--port", String(port)], {
  cwd: websiteRoot,
  stdio: ["ignore", "ignore", "pipe"],
});
let stderr = "";
server.stderr.setEncoding("utf8");
server.stderr.on("data", (chunk) => {
  stderr += chunk;
});

try {
  await waitForServer(port, server, () => stderr);
  await materializeArtifacts(port);
  await renderRoutes(port, routes);
  await fs.writeFile(path.join(siteRoot, "404.html"), notFoundDocument());
} finally {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
}

async function materializeArtifacts(port: number): Promise<void> {
  await Promise.all(
    [...new Set(artifactPaths)].map(async (artifactPath) => {
      const response = await fetch(`http://127.0.0.1:${port}${artifactPath}`);
      if (!response.ok) {
        throw new Error(
          `Static artifact materialization failed for ${artifactPath}: ${response.status}`,
        );
      }
      const output = artifactOutputPath(artifactPath);
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, Buffer.from(await response.arrayBuffer()));
    }),
  );
}

async function copyStaticAssets(): Promise<string> {
  await fs.rm(siteRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  await fs.cp(clientRoot, siteRoot, { recursive: true });
  await rewriteStaticStyles();

  const clientEntry = path.join(siteRoot, "client.js");
  const source = (await fs.readFile(clientEntry, "utf8")).replace(/(["'`])\.\/assets\//g, "$1./");
  const fingerprint = createHash("sha256").update(source).digest("hex").slice(0, 12);
  const output = path.join(siteRoot, "assets", `client-${fingerprint}.js`);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, source);
  await fs.rm(clientEntry);
  await fs.rm(path.join(siteRoot, "client.js.map"), { force: true });
  return `${siteBase}assets/client-${fingerprint}.js`;
}

async function rewriteStaticStyles(): Promise<void> {
  const files = await fs.readdir(siteRoot, { recursive: true });
  await Promise.all(
    files
      .filter((file) => file.endsWith(".css"))
      .map(async (file) => {
        const pathname = path.join(siteRoot, file);
        const source = await fs.readFile(pathname, "utf8");
        const rewritten = source.replace(/(url\((?:"|')?)\/(?!\/)/g, `$1${siteBase}`);
        if (rewritten !== source) await fs.writeFile(pathname, rewritten);
      }),
  );
}

async function rewriteSearchLinks(): Promise<void> {
  const assetsRoot = path.join(siteRoot, "assets");
  let files: ReadonlyArray<string>;
  try {
    files = await fs.readdir(assetsRoot);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }

  await Promise.all(
    files
      .filter((file) => file.endsWith(".js"))
      .map(async (file) => {
        const pathname = path.join(assetsRoot, file);
        const source = await fs.readFile(pathname, "utf8");
        const rewritten = source.replace(/(["']?href["']?\s*:\s*["'`])\/(?!\/)/g, `$1${siteBase}`);
        if (rewritten !== source) await fs.writeFile(pathname, rewritten);
      }),
  );
}

async function renderRoutes(port: number, routePaths: ReadonlyArray<string>): Promise<void> {
  const concurrency = 16;
  let next = 0;
  const render = async () => {
    while (next < routePaths.length) {
      const route = routePaths[next++];
      const response = await fetch(`http://127.0.0.1:${port}${route}`);
      if (!response.ok) throw new Error(`Static render failed for ${route}: ${response.status}`);
      const html = await response.text();
      if (!html.includes("<main")) throw new Error(`Static render was not semantic HTML: ${route}`);
      const output = routeOutputPath(route);
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, rewriteDocument(html, route));
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, routePaths.length) }, render));
}

function routeOutputPath(route: string): string {
  return sitePath(route, "index.html");
}

function artifactOutputPath(artifactPath: string): string {
  return sitePath(artifactPath);
}

function sitePath(route: string, ...tail: ReadonlyArray<string>): string {
  const segments = route
    .split("/")
    .filter(Boolean)
    .flatMap((segment) => decodeURIComponent(segment).split("/"));
  if (
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..") ||
    segments.some((segment) => path.isAbsolute(segment))
  ) {
    throw new Error(`Unsafe static route: ${route}`);
  }
  const output = path.resolve(siteRoot, ...segments, ...tail);
  const relative = path.relative(siteRoot, output);
  if (relative === "" || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Static route escapes output root: ${route}`);
  }
  return output;
}

function rewriteDocument(html: string, route: string): string {
  const markdownPath = routeByPath.get(route)?.markdownPath ?? markdownPathForPath(route);
  const withPaths = html.replace(
    /\b(href|src|action)=("|')\/([^"']*)/g,
    (match, attribute: string, quote: string, pathname: string) =>
      pathname.startsWith(siteBase.slice(1))
        ? match
        : `${attribute}=${quote}${siteBase}${pathname}`,
  );
  return withPaths
    .replace(/<html\b([^>]*)>/, `<html$1 data-site-base="${siteBase}">`)
    .replace(`href="${origin}/"`, `href="${origin}${route}"`)
    .replace(`href="${origin}/index.md"`, `href="${origin}${markdownPath ?? "/index.md"}"`)
    .replace(
      new RegExp(`(\\bsrc=(?:"|'))${escapeRegExp(`${siteBase}client.js`)}((?:"|'))`, "g"),
      `$1${clientEntryUrl}$2`,
    );
}

function notFoundDocument(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page not found — Typed</title>
    <link rel="stylesheet" href="${siteBase}styles.css" />
  </head>
  <body>
    <main id="main-content" tabindex="-1">
      <section class="hero">
        <p class="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The page may have moved, or the link is incomplete.</p>
        <p><a href="${siteBase}">Return to Typed</a></p>
      </section>
    </main>
  </body>
</html>
`;
}

function normalizeBase(value: string): string {
  if (!value.startsWith("/")) throw new Error("SITE_BASE must start with '/'.");
  return value.endsWith("/") ? value : `${value}/`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function availablePort(): Promise<number> {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("No local port available.");
  server.close();
  await once(server, "close");
  return address.port;
}

async function waitForServer(
  port: number,
  server: ReturnType<typeof spawn>,
  readStderr: () => string,
): Promise<void> {
  let cause: unknown;
  for (let attempt = 0; attempt < 200; attempt++) {
    if (server.exitCode !== null) {
      throw new Error(`Static renderer exited with ${server.exitCode}: ${readStderr()}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) return;
      cause = new Error(`Static renderer returned ${response.status}`);
    } catch (error) {
      cause = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Static renderer did not become ready: ${readStderr()}`, { cause });
}
