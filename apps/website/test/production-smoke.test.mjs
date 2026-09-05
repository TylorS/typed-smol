import assert from "node:assert/strict";
import { preview } from "astro";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = (process.env.SITE_BASE ?? "/typed-smol/").replace(/\/$/u, "");

test(
  "the GitHub Pages build renders, hydrates, searches, and respects theme and mobile boundaries",
  { timeout: 90000 },
  async (t) => {
    const server = await preview({
      root,
      server: { host: "127.0.0.1", port: 0 },
      logLevel: "silent",
    });
    t.after(() => server.stop());
    const origin = `http://127.0.0.1:${server.port}`;
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const context = await browser.newContext({
      colorScheme: "dark",
      viewport: { width: 1440, height: 950 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}${base}/`);
    assert.match(await page.title(), /Typed/);
    await page.waitForFunction(() =>
      [...document.querySelectorAll("astro-island")].every((island) => !island.hasAttribute("ssr")),
    );
    assert.deepEqual(
      await page
        .locator('.release-demo input[type="checkbox"]')
        .evaluateAll((inputs) => inputs.map((input) => input.checked)),
      [true, false, false],
    );
    await page.getByLabel("Connect the interface").check();
    await page.waitForFunction(() =>
      document.querySelector(".release-demo output")?.textContent?.includes("2 / 3"),
    );
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page.waitForFunction(() =>
      document.querySelector(".release-demo output")?.textContent?.includes("1 / 3"),
    );
    await page.getByRole("button", { name: "Switch color theme" }).click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "matrix-light");
    await page.reload();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "matrix-light");
    await page.getByRole("button", { name: /Search docs/ }).click();
    await page.getByRole("dialog").waitFor({ state: "visible" });
    assert.equal(await page.getByRole("dialog").getAttribute("aria-label"), null);
    assert.equal(await page.getByRole("dialog").getAttribute("aria-describedby"), null);
    await page.getByRole("searchbox").fill("RefSubject");
    await page.getByRole("dialog").getByRole("link").first().waitFor();
    const result = await page.getByRole("dialog").getByRole("link").first().getAttribute("href");
    assert.ok(result.startsWith(`${base}/`));
    assert.equal((await fetch(`${origin}${result}`)).status, 200);
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("searchbox").inputValue(), "");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    for (const route of [
      "explore/quick-start/",
      "explore/tutorial/model-the-domain/",
      "explore/application-developers/",
      "explore/library-developers/",
      "integrate/astro/",
      "reference/modules/@typed/fx/Fx/",
      "reference/packages/@typed/astro/",
      "glossary/",
    ]) {
      const response = await page.goto(`${origin}${base}/${route}`);
      assert.equal(response.status(), 200, route);
      assert.equal(await page.locator("main h1").count(), 1, route);
      assert.ok((await page.locator("main").innerText()).length > 100, route);
    }
    await page.goto(`${origin}${base}/explore/tutorial/`);
    await page.getByPlaceholder("What needs to be done?").fill("Verify the Astro build");
    await page.getByPlaceholder("What needs to be done?").press("Enter");
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".todo-demo__edit")].some(
        (input) => input.value === "Verify the Astro build",
      ),
    );
    for (const scheme of ["dark", "light"]) {
      const mobile = await browser.newPage({
        viewport: { width: 390, height: 844 },
        colorScheme: scheme,
      });
      mobile.on("pageerror", (error) => errors.push(error.message));
      for (const route of [
        "",
        "explore/application-developers/",
        "reference/modules/@typed/template/",
      ]) {
        await mobile.goto(`${origin}${base}/${route}`);
        assert.equal(
          await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          `${scheme} ${route} must not overflow`,
        );
      }
      assert.equal(
        await mobile.locator("html").getAttribute("data-theme"),
        scheme === "dark" ? "matrix" : "matrix-light",
      );
      await mobile.close();
    }
    assert.equal((await fetch(`${origin}${base}/this-page-does-not-exist/`)).status, 404);
    for (const artifact of [
      "llms.txt",
      "llms-full.txt",
      "docs-manifest.json",
      "sitemap.xml",
      ".well-known/ard.json",
      "index.md",
      "explore/quick-start.md",
    ])
      assert.equal((await fetch(`${origin}${base}/${artifact}`)).status, 200, artifact);
    assert.deepEqual(errors, []);
  },
);
