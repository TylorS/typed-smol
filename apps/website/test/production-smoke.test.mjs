import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

test("the built server serves semantic HTML, client assets, and intentional 404s", async (t) => {
  const port = await availablePort();
  const child = spawn(process.execPath, ["dist/server/server.js", "--port", String(port)], {
    cwd: import.meta.dirname + "/..",
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  t.after(async () => {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await once(child, "exit");
    }
  });

  const home = await waitForResponse(`http://127.0.0.1:${port}/`, child, () => stderr);
  assert.equal(home.status, 200);
  assert.match(home.headers.get("content-type") ?? "", /^text\/html\b/);
  const html = await home.text();
  assert.match(html, /<main\b/);
  assert.match(html, /<a class="skip" href="#main-content">Skip to content<\/a>/);
  assert.match(html, /<main[^>]*id="main-content"[^>]*tabindex="-1"/);
  assert.match(html, /<title>Typed — Cooperative by design<\/title>/);
  assert.match(html, /<h1[^>]*>\s*Cooperative<br\/>\s*by design\s*<\/h1>/);
  assert.match(html, /<nav\b/);
  assert.match(html, /class="chapter template-chapter"/);
  assert.match(html, /Declarative templates\. Real DOM\./);
  assert.match(html, /Fx&lt;RenderEvent, E, R&gt;/);

  for (const [path, heading] of [
    ["/explore", "Build up the system"],
    ["/explore/fx-push-reactivity", "Fx: work arrives"],
    ["/explore/building-fx", "Building Fx values"],
    ["/explore/transforming-fx", "Transforming Fx"],
    ["/explore/composing-fx", "Composing Fx"],
    ["/explore/consuming-fx", "Consuming Fx"],
    ["/explore/composing-refsubject-state", "Composing RefSubject state"],
    ["/explore/specialized-refsubject-state", "Working with Versioned state"],
    ["/explore/choosing-ui-components", "Choosing Typed UI components"],
    ["/explore/ui-collections-and-focus", "UI collections, focus, and keyboard behavior"],
    ["/explore/dom-parts-and-attributes", "DOM scalar parts and attributes"],
    ["/explore/dom-class-names", "Class names without className replacement"],
    ["/explore/dom-render-event", "Using DomRenderEvent"],
    ["/explore/html-render-event", "Using HtmlRenderEvent"],
    ["/integrate", "Bring another renderer with you."],
    ["/integrate/dom-output", "Pass existing DOM into Typed"],
    ["/integrate/html-output", "Pass trusted HTML into Typed SSR"],
    ["/integrate/react", "Use React and Typed together"],
    ["/integrate/svelte", "Use Svelte 5 and Typed together"],
    ["/integrate/vue", "Use Vue and Typed together"],
    ["/integrate/web-component", "Use Web Components and Typed together"],
    ["/reference", "API reference"],
    ["/glossary", "Glossary"],
  ]) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    assert.equal(response.status, 200, path);
    const routeHtml = await response.text();
    assert.match(
      routeHtml,
      new RegExp(`<h1[^>]*>[\\s\\S]*?${escapeRegExp(heading)}[\\s\\S]*?<\\/h1>`),
    );
    assert.match(routeHtml, /<main[^>]*id="main-content"[^>]*tabindex="-1"/);
    assert.doesNotMatch(routeHtml, /<title>Typed — Cooperative by design<\/title>/, path);
  }

  const exploreHtml = await (
    await fetch(`http://127.0.0.1:${port}/explore/fx-push-reactivity`)
  ).text();
  assert.match(exploreHtml, /<title>Fx: work arrives — Typed<\/title>/);
  assert.doesNotMatch(exploreHtml, /aria-current="(?:undefined)?"/);
  assert.match(
    exploreHtml,
    /<nav aria-label="Primary navigation">[\s\S]*?<a[^>]*(?:href="\/explore"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/explore")[^>]*>/,
  );
  assert.equal((exploreHtml.match(/aria-current="page"/g) ?? []).length, 2);
  assert.match(exploreHtml, /<nav aria-label="Resources">/);

  const unknownGuide = await fetch(`http://127.0.0.1:${port}/explore/not-a-real-guide`);
  assert.equal(unknownGuide.status, 404);

  const symbolPage = await fetch(
    `http://127.0.0.1:${port}/reference/${encodeURIComponent("@typed/template/many#many")}`,
  );
  assert.equal(symbolPage.status, 200);
  const symbolHtml = await symbolPage.text();
  assert.match(symbolHtml, /<title>many — @typed\/template\/many — Typed<\/title>/);
  assert.match(symbolHtml, /<main[^>]*data-symbol-id="@typed\/template\/many#many"/);
  assert.match(symbolHtml, /<h1[^>]*>[\s\S]*?many[\s\S]*?<\/h1>/);
  assert.match(symbolHtml, /Cost model and moves/);
  assert.match(symbolHtml, /moveBefore/);
  assert.match(symbolHtml, /packages\/template\/src\/many\.ts/);

  const weightedHtml = await fetch(
    `http://127.0.0.1:${port}/reference/${encodeURIComponent("@typed/template/many#many")}`,
    { headers: { accept: "text/markdown;q=0, text/html;q=1" } },
  );
  assert.match(weightedHtml.headers.get("content-type") ?? "", /^text\/html\b/);

  const packagePage = await fetch(
    `http://127.0.0.1:${port}/reference/packages/${encodeURIComponent("@typed/ui")}`,
  );
  assert.equal(packagePage.status, 200);
  assert.match(await packagePage.text(), /<h1[^>]*>[\s\S]*?@typed\/ui[\s\S]*?<\/h1>/);

  const moduleId = "@typed/template/RenderEvent";
  const modulePage = await fetch(
    `http://127.0.0.1:${port}/reference/modules/${encodeURIComponent(moduleId)}`,
  );
  assert.equal(modulePage.status, 200);
  assert.match(
    await modulePage.text(),
    /<h1[^>]*>[\s\S]*?@typed\/template\/RenderEvent[\s\S]*?<\/h1>/,
  );

  const resourceId = "@typed/tsconfig/base#$resource";
  const resourcePage = await fetch(
    `http://127.0.0.1:${port}/reference/${encodeURIComponent(resourceId)}`,
  );
  assert.equal(resourcePage.status, 200);
  assert.match(await resourcePage.text(), /<h1[^>]*>[\s\S]*?\$resource[\s\S]*?<\/h1>/);

  const moduleMarkdown = await fetch(
    `http://127.0.0.1:${port}/reference/modules/${encodeURIComponent(moduleId)}`,
    { headers: { accept: "text/markdown" } },
  );
  assert.match(moduleMarkdown.headers.get("content-type") ?? "", /^text\/markdown\b/);
  assert.match(await moduleMarkdown.text(), /^# @typed\/template\/RenderEvent/m);

  const resourceJson = await fetch(
    `http://127.0.0.1:${port}/docs/reference/exposures/${referenceSlug(resourceId)}.json`,
  );
  assert.equal(resourceJson.status, 200);
  const resourcePayload = await resourceJson.json();
  assert.equal(resourcePayload.id, resourceId);
  assert.equal(resourcePayload.exposure.id, resourceId);

  const caseDistinctIds = ["@typed/fx/Subject#Share", "@typed/fx/Subject#share"];
  const caseDistinctPayloads = await Promise.all(
    caseDistinctIds.map(async (id) => {
      const response = await fetch(
        `http://127.0.0.1:${port}/docs/reference/exposures/${referenceSlug(id)}.json`,
      );
      assert.equal(response.status, 200, id);
      return response.json();
    }),
  );
  assert.deepEqual(
    caseDistinctPayloads.map(({ id }) => id),
    caseDistinctIds,
  );

  const markdown = await fetch(`http://127.0.0.1:${port}/explore`, {
    headers: { accept: "text/markdown" },
  });
  assert.match(markdown.headers.get("content-type") ?? "", /^text\/markdown\b/);
  assert.match(markdown.headers.get("vary") ?? "", /Accept/);
  assert.match(await markdown.text(), /^# Build up the system/m);
  assert.match(markdown.headers.get("content-signal") ?? "", /ai-input=yes/);
  assert.match(markdown.headers.get("link") ?? "", /rel=alternate/);

  const search = await fetch(`http://127.0.0.1:${port}/api/docs/search?q=DomRenderEvent`);
  assert.equal(search.status, 200);
  assert.match(search.headers.get("content-type") ?? "", /^application\/json\b/);
  assert.equal((await search.json()).results[0].id, "@typed/template#DomRenderEvent");
  assert.doesNotMatch(search.headers.get("link") ?? "", /rel=alternate/);

  const shareSearch = await fetch(`http://127.0.0.1:${port}/api/docs/search?q=share&limit=10`);
  assert.equal(shareSearch.status, 200);
  const shareResults = (await shareSearch.json()).results;
  assert.equal(
    new Set(shareResults.map(({ canonicalId, id }) => canonicalId ?? id)).size,
    shareResults.length,
  );
  assert.equal(shareResults.length, 10, "share search should fill the limit with distinct APIs");

  const symbolApi = await fetch(
    `http://127.0.0.1:${port}/api/docs/symbol/${encodeURIComponent("@typed/template/many#many")}`,
  );
  assert.equal(symbolApi.status, 200);
  const symbolPayload = await symbolApi.json();
  assert.equal(symbolPayload.id, "@typed/template/many#many");
  assert.equal(typeof symbolPayload.canonicalId, "string");
  assert.equal(symbolPayload.exposure.declarationKey, symbolPayload.declaration.declarationKey);
  assert.equal(symbolPayload.exposure.consumerSpecifier, "@typed/template/many");
  assert.ok(Array.isArray(symbolPayload.exposure.sourceSpans));
  assert.ok(Array.isArray(symbolPayload.declaration.facets));

  const openApi = await fetch(`http://127.0.0.1:${port}/api/docs/openapi.json`);
  assert.equal(openApi.status, 200);
  const openApiDocument = await openApi.json();
  assert.ok(openApiDocument.paths["/api/docs/search"]);
  assert.ok(openApiDocument.paths["/api/docs/symbol/{id}"]);

  const initialized = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "typed-smoke", version: "1.0.0" },
      },
    }),
  });
  assert.equal(initialized.status, 200);
  assert.equal((await initialized.json()).result.serverInfo.name, "typed-docs");

  const tools = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
  });
  assert.deepEqual(
    (await tools.json()).result.tools.map(({ name }) => name),
    ["search_docs", "get_symbol", "get_guide", "get_glossary_term"],
  );

  const symbolTool = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "get_symbol", arguments: { id: "@typed/template/many#many" } },
    }),
  });
  assert.equal(symbolTool.status, 200);
  const symbolToolPayload = JSON.parse((await symbolTool.json()).result.content[0].text);
  assert.equal(symbolToolPayload.id, "@typed/template/many#many");
  assert.equal(symbolToolPayload.canonicalId, symbolPayload.canonicalId);
  assert.equal(
    symbolToolPayload.exposure.declarationKey,
    symbolToolPayload.declaration.declarationKey,
  );

  for (const path of [
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/docs-manifest.json",
    "/.well-known/ard.json",
    "/.well-known/api-catalog",
    "/.well-known/agent-skills/index.json",
    "/schemas/documentation-v1.json",
  ]) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    assert.equal(response.status, 200, path);
  }

  const manifestResponse = await fetch(`http://127.0.0.1:${port}/docs-manifest.json`);
  const manifest = await manifestResponse.json();
  assert.ok(manifest.counts.uniqueExports > 0);
  assert.ok(
    manifest.routes.filter(({ kind }) => kind === "exposure").length >=
      manifest.counts.uniqueExports,
  );
  assert.equal(manifest.counts.exposures, undefined);
  assert.ok(manifest.routes.some(({ id }) => id === resourceId));
  assert.ok(manifest.routes.some(({ id }) => id === `module:${moduleId}`));
  assert.equal(
    manifest.schema,
    "https://tylors.github.io/typed-smol/schemas/documentation-v1.json",
  );
  const schemaResponse = await fetch(
    manifest.schema.replace("https://tylors.github.io/typed-smol", `http://127.0.0.1:${port}`),
  );
  assert.equal(schemaResponse.status, 200);
  assert.equal((await schemaResponse.json()).$id, manifest.schema);

  const sitemap = await fetch(`http://127.0.0.1:${port}/sitemap.xml`);
  assert.match(
    await sitemap.text(),
    new RegExp(encodeURIComponent(resourceId).replaceAll("%", "%")),
  );

  const client = await fetch(`http://127.0.0.1:${port}/client.js`);
  assert.equal(client.status, 200);
  assert.match(client.headers.get("content-type") ?? "", /javascript/);
  assert.equal(client.headers.get("cache-control"), "no-cache");

  for (const path of [
    "/definitely-missing",
    `/reference/${encodeURIComponent("@typed/fx#definitelyMissing")}`,
    `/reference/modules/${encodeURIComponent("@typed/fx/definitelyMissing")}`,
    `/reference/packages/${encodeURIComponent("@typed/definitely-missing")}`,
  ]) {
    const missing = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: { accept: "text/markdown" },
    });
    assert.equal(missing.status, 404, path);
    assert.doesNotMatch(missing.headers.get("link") ?? "", /rel=alternate/);
  }
});

async function availablePort() {
  const { createServer } = await import("node:net");
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  const port = address.port;
  server.close();
  await once(server, "close");
  return port;
}

function referenceSlug(value) {
  return Buffer.from(value, "utf8").toString("hex");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function waitForResponse(url, child, stderr) {
  let cause;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) {
      throw new Error(`server exited with ${child.exitCode}: ${stderr()}`);
    }
    try {
      return await fetch(url);
    } catch (error) {
      cause = error;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  throw new Error(`server did not become ready: ${stderr()}`, { cause });
}
