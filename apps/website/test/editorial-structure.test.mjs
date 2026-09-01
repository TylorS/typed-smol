import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("the homepage derives its public Fx vocabulary from the reference inventory", async () => {
  const homeSource = await readFile(new URL("../src/pages/Home.ts", import.meta.url), "utf8");
  const catalogSource = await readFile(
    new URL("../src/generated/catalog.ts", import.meta.url),
    "utf8",
  );
  const referenceInventory = JSON.parse(
    await readFile(new URL("../src/generated/reference.json", import.meta.url), "utf8"),
  );
  const fxChapter = homeSource.slice(
    homeSource.indexOf('class="chapter fx-chapter"'),
    homeSource.indexOf('class="chapter state-chapter"'),
  );
  assert.match(fxChapter, /commands, requests, workers, schedules, and\s+subscriptions/);
  assert.match(fxChapter, /fxCombinatorCount/);
  assert.match(fxChapter, /<code>map<\/code>/);
  assert.match(fxChapter, /<code>filter<\/code>/);
  assert.match(fxChapter, /mapEffect/);
  assert.match(fxChapter, /switchMap/);
  assert.match(
    fxChapter,
    /href="\/reference\/modules\/%40typed%2Ffx%2FFx#category-combinators"/,
  );
  const fxModule = referenceInventory.modules.find(
    ({ consumerSpecifier }) => consumerSpecifier === "@typed/fx/Fx",
  );
  const publicCombinators = fxModule.categories.find(({ name }) => name === "combinators");
  assert.match(
    catalogSource,
    new RegExp(`export const fxCombinatorCount = ${publicCombinators.exposureIds.length} as const;`),
  );
  assert.doesNotMatch(fxChapter, /\b(?:template|renderer|DOM|UI)\b/i);
});

test("the homepage consolidates interoperability and routes each audience onward", async (t) => {
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

  const response = await waitForResponse(`http://127.0.0.1:${port}/`, child, () => stderr);
  assert.equal(response.status, 200);
  const homeHtml = await response.text();
  const homeDocument = homeHtml.slice(homeHtml.indexOf("<main"));
  const storyOrder = [
    'id="home-title"',
    'id="fx-title"',
    'id="state-title"',
    'id="template-title"',
    'id="ui-title"',
    'id="interoperability-title"',
    'id="router-title"',
    'id="start-title"',
  ].map((marker) => homeDocument.indexOf(marker));

  assert.ok(storyOrder.every((index) => index >= 0));
  assert.deepEqual(
    storyOrder,
    [...storyOrder].sort((a, b) => a - b),
  );
  assert.equal(homeDocument.match(/<section class="chapter /g)?.length, 7);
  assert.match(homeDocument, /class="chapter interoperability-chapter"/);
  assert.match(homeDocument, /class="chapter router-chapter"/);
  assert.doesNotMatch(homeDocument, /class="chapter (?:dom|integration)-chapter"/);
  assert.doesNotMatch(homeDocument, /class="chapter applications-chapter"/);
  assert.match(homeDocument, /class="start-paths"/);
  assert.match(homeDocument, /<a class="start-path" href="\/explore">/);
  assert.match(homeDocument, /<a class="start-path" href="\/integrate">/);
  assert.match(homeDocument, /<a class="start-path" href="\/reference">/);
});

test("the editorial shell exposes a progressive, readable document structure", async (t) => {
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

  const homeResponse = await waitForResponse(`http://127.0.0.1:${port}/`, child, () => stderr);
  assert.equal(homeResponse.status, 200);
  const homeHtml = await homeResponse.text();
  assert.match(homeHtml, /class="home-hero"/);
  assert.match(homeHtml, /<a class="skip" href="#main-content">/);
  assert.match(homeHtml, /<main[^>]*id="main-content"[^>]*tabindex="-1"/);
  assert.match(homeHtml, /class="chapter fx-chapter"/);
  assert.doesNotMatch(homeHtml, /class="principles grid"/);
  assert.doesNotMatch(homeHtml, /style="/);

  assert.match(homeHtml, /data-search-open[^>]*aria-expanded="false"/);
  assert.match(homeHtml, /<dialog[^>]*data-search-dialog/);
  assert.match(homeHtml, /data-search-input/);
  assert.match(homeHtml, /data-search-results/);
  assert.match(homeHtml, /data-search-close/);
  assert.match(homeHtml, /<div class="search-dialog__form" role="search">/);
  assert.doesNotMatch(homeHtml, /<form method="dialog"/);
  assert.match(homeHtml, /<button class="search-close" type="button"[^>]*data-search-close/);

  const baseCss = await readFile(new URL("../public/styles/base.css", import.meta.url), "utf8");
  assert.match(baseCss, /\.search-results-list\s*\{/);
  assert.match(baseCss, /\.search-results-list\s+li\s*\{/);
  assert.match(baseCss, /\.search-results-list\s+a\s*\{/);
  assert.match(baseCss, /\.search-results-list\s+small\s*\{/);
  assert.match(baseCss, /\.search-empty\s*\{/);
  assert.match(baseCss, /\.search-results-list[^}]*:hover/);

  const guideResponse = await fetch(
    `http://127.0.0.1:${port}/explore/dom-updates-and-reconciliation`,
  );
  assert.equal(guideResponse.status, 200);
  const guideHtml = await guideResponse.text();
  assert.match(guideHtml, /class="guide-intro"/);
  assert.match(guideHtml, /class="reading-width"/);
  assert.match(guideHtml, /class="explore-navigation"/);
  assert.match(guideHtml, /aria-current="page"/);
  assert.doesNotMatch(guideHtml, /aria-current="(?:<!--txt-->|&lt;!--txt--&gt;)"/);
  assert.doesNotMatch(guideHtml, /class="page-head"/);
  assert.doesNotMatch(guideHtml, /style="/);

  const exploreHtml = await (await fetch(`http://127.0.0.1:${port}/explore`)).text();
  assert.match(exploreHtml, /class="explore-navigation"/);
  assert.match(exploreHtml, />Fx</);
  assert.match(exploreHtml, />State</);
  assert.match(exploreHtml, />Templates</);
  assert.match(exploreHtml, />UI</);
  assert.match(exploreHtml, /DOM and platform/);
  assert.match(exploreHtml, /guide-kind--concept/);
  assert.match(exploreHtml, /guide-kind--deep-dive/);

  const referenceHtml = await (await fetch(`http://127.0.0.1:${port}/reference`)).text();
  assert.match(referenceHtml, /class="[^"]*reference-overview/);
  assert.match(referenceHtml, /class="reference-overview__summary"/);
  assert.match(referenceHtml, /class="reference-package-list"/);
  assert.match(referenceHtml, /class="reference-package-row"/);
  assert.doesNotMatch(referenceHtml, /class="reference-table"/);

  const packageHtml = await (
    await fetch(`http://127.0.0.1:${port}/reference/packages/%40typed%2Ffx`)
  ).text();
  assert.match(packageHtml, /class="reference-breadcrumb"/);
  assert.match(packageHtml, /class="reference-package-facts"/);
  assert.match(packageHtml, /class="reference-modules"/);
  assert.match(packageHtml, /class="reference-module-list"/);
  assert.match(packageHtml, /class="reference-module-row"/);

  const moduleHtml = await (
    await fetch(`http://127.0.0.1:${port}/reference/modules/%40typed%2Fasync-data`)
  ).text();
  assert.match(moduleHtml, /class="reference-module-facts"/);
  assert.match(moduleHtml, /class="reference-category-list"/);
  assert.match(moduleHtml, /class="reference-symbol-row"/);

  const symbolHtml = await (
    await fetch(`http://127.0.0.1:${port}/reference/%40typed%2Fasync-data%23AsyncData`)
  ).text();
  assert.match(symbolHtml, /class="reference-breadcrumb"/);
  assert.match(symbolHtml, /class="[^"]*symbol-overview/);
  assert.match(symbolHtml, /class="reference-signature__code language-typescript"/);
  assert.match(
    symbolHtml,
    /reference-signature__code language-typescript">[\s\S]*?<span class="tok-keyword">export<\/span>/,
  );
  assert.match(symbolHtml, /class="symbol-section-list"/);
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
