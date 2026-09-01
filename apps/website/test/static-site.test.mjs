import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { once } from "node:events";
import { promisify } from "node:util";
import { test } from "node:test";

const execFileAsync = promisify(execFile);
const websiteRoot = path.resolve(import.meta.dirname, "..");
const siteRoot = path.join(websiteRoot, "dist/site");

test("static build emits deployable semantic route documents and agent artifacts", async () => {
  await execFileAsync("pnpm", ["build:static"], {
    cwd: websiteRoot,
    maxBuffer: 16 * 1024 * 1024,
  });

  const home = await readFile(routeFile("/"), "utf8");
  assert.match(home, /href="\/typed-smol\/explore"/);
  assert.match(home, /href="\/typed-smol\/styles\.css"/);
  assert.doesNotMatch(home, /\/typed-smol\/typed-smol\//);
  for (const href of [
    "/typed-smol/llms.txt",
    "/typed-smol/.well-known/agent-skills/index.json",
    "/typed-smol/docs-manifest.json",
  ]) {
    assert.ok(home.includes(`href="${href}"`), href);
  }
  const styles = await readFile(path.join(siteRoot, "styles.css"), "utf8");
  assert.doesNotMatch(styles, /@import\s+url\(["']?\/styles\//);
  assert.match(styles, /@import\s+url\(["']?\/typed-smol\/styles\//);
  const client = home.match(/<script[^>]*src="(\/typed-smol\/assets\/client-[a-f0-9]+\.js)"/);
  assert.ok(client, "static pages load the fingerprinted progressive client");
  const clientPath = path.join(siteRoot, client[1].replace("/typed-smol/", ""));
  await stat(clientPath);
  const clientSource = await readFile(clientPath, "utf8");
  assert.doesNotMatch(clientSource, /\.\/assets\/(?:search|Operations)-/);
  assert.match(clientSource, /\.\/(?:search|Operations)-/);
  assert.doesNotMatch(home, /search-index/);

  const lazySearch = (await readdir(path.join(siteRoot, "assets"))).find((file) =>
    file.startsWith("search-"),
  );
  assert.ok(lazySearch, "search data stays in a separate on-demand chunk");
  const searchSource = await readFile(path.join(siteRoot, "assets", lazySearch), "utf8");
  assert.doesNotMatch(searchSource, /["']href["']:\s*["'`]\/reference/);

  const notFound = await readFile(path.join(siteRoot, "404.html"), "utf8");
  assert.match(notFound, /<main\b/);
  assert.match(notFound, /404|Not Found/i);

  for (const pathname of [
    "styles.css",
    "robots.txt",
    "agent-skills/typed/SKILL.md",
    "docs/reference/manifest.json",
    "schemas/documentation-v1.json",
  ]) {
    await stat(path.join(siteRoot, pathname));
  }

  assert.deepEqual(await brokenLocalReferences(), []);

  await assert.rejects(stat(path.join(siteRoot, "client.js")));

  await withStaticServer(async (origin) => {
    const artifactPaths = [
      "/llms.txt",
      "/llms-full.txt",
      "/docs-manifest.json",
      "/sitemap.xml",
      "/.well-known/mcp.json",
      "/.well-known/api-catalog",
      "/.well-known/ard.json",
      "/.well-known/agent-skills/index.json",
      "/api/docs/openapi.json",
      "/explore.md",
      "/explore/cooperative-by-design.md",
    ];
    for (const pathname of artifactPaths) {
      assert.equal((await fetch(`${origin}${pathname}`)).status, 200, pathname);
    }

    const manifest = await (await fetch(`${origin}/docs-manifest.json`)).json();
    for (const { canonicalPath, kind, markdownPath } of manifest.routes) {
      if (kind !== "page") continue;
      const html = await readFile(routeFile(canonicalPath), "utf8");
      assert.match(html, /<main\b/, canonicalPath);
      assert.equal((await fetch(`${origin}${markdownPath}`)).status, 200, markdownPath);
    }
  });
});

function routeFile(route) {
  return staticPath(decodeURIComponent(route));
}

async function brokenLocalReferences() {
  const files = await readdir(siteRoot, { recursive: true });
  const broken = [];

  for (const file of files.filter((candidate) => candidate.endsWith(".html"))) {
    const source = await readFile(path.join(siteRoot, file), "utf8");
    const references = [...source.matchAll(/\b(?:href|src)=(?:"|')([^"']+)(?:"|')/gu)].map(
      (match) => match[1],
    );

    for (const reference of references) {
      if (/^(?:https?:|mailto:|#)/u.test(reference)) continue;
      const pathname = decodeURIComponent(new URL(reference, "https://local.test").pathname)
        .replace(/^\/typed-smol(?=\/|$)/u, "") || "/";
      const target = path.resolve(siteRoot, `.${pathname}`);
      const candidates = path.extname(target) === "" ? [target, path.join(target, "index.html")] : [target];
      if (!candidates.some((candidate) => existsSync(candidate))) {
        broken.push(`${file} -> ${reference}`);
      }
    }
  }

  return broken.sort();
}

async function withStaticServer(run) {
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url, "http://static.test");
    const pathname = decodeURIComponent(
      requestUrl.pathname.replace(/^\/typed-smol(?=\/|$)/, "") || "/",
    );
    const file = staticPath(pathname);
    try {
      const content = await readFile(file);
      response.writeHead(200);
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  try {
    await run(`http://127.0.0.1:${address.port}/typed-smol`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

function staticPath(pathname) {
  const candidate = path.resolve(siteRoot, `.${pathname}`);
  if (path.relative(siteRoot, candidate).startsWith("..")) throw new Error("unsafe static request");
  return (existsSync(candidate) && statSync(candidate).isFile()) || path.extname(candidate) !== ""
    ? candidate
    : path.join(candidate, "index.html");
}
