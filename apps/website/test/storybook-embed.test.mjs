import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { preview } from "astro";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = (process.env.SITE_BASE ?? "/typed-smol/").replace(/\/$/u, "");

test(
  "the website ships the maintained stories with working controls, keyboard input, and themes",
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
    const page = await browser.newPage({
      colorScheme: "dark",
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const index = await fetch(`${origin}${base}/storybook/index.json`).then((response) => {
      assert.equal(response.status, 200, "the Storybook index is part of the static site");
      return response.json();
    });
    for (const group of ["Foundations", "Inputs", "Patterns"]) {
      const source = await readFile(
        new URL(`../../../packages/ui/stories/${group}.stories.ts`, import.meta.url),
        "utf8",
      );
      for (const [, name] of source.matchAll(/^export const (\w+)\s*=/gmu)) {
        assert.ok(
          Object.values(index.entries).some(
            (entry) => entry.title === group && entry.exportName === name,
          ),
          `${group}.${name} is included in the published Storybook`,
        );
      }
    }

    const response = await page.goto(`${origin}${base}/explore/storybook/`);
    assert.equal(response.status(), 200);
    const manager = page.frameLocator('iframe[title="Typed UI component Storybook"]');
    const story = manager.frameLocator("#storybook-preview-iframe");
    const save = story.getByRole("button", { name: "Save changes", exact: true });
    await save.waitFor();
    await save.focus();
    await page.keyboard.press("Enter");
    await story.getByText("Changes saved 1 time", { exact: true }).waitFor();

    await page.waitForFunction(() =>
      [...document.querySelectorAll("astro-island")].every((island) => !island.hasAttribute("ssr")),
    );
    await page.getByRole("button", { name: "Switch color theme" }).click();
    await page.waitForFunction(() => {
      const manager = document.querySelector("iframe").contentDocument;
      const story = manager.querySelector("#storybook-preview-iframe").contentDocument;
      return (
        document.documentElement.dataset.theme === "matrix-light" &&
        manager.documentElement.dataset.theme === "matrix-light" &&
        story.documentElement.dataset.theme === "matrix-light"
      );
    });
    assert.equal(
      await story.getByText("Changes saved 1 time", { exact: true }).count(),
      1,
      "changing the website theme keeps the current story state",
    );

    // The manager keeps its native controls and navigation inside the embed.
    await manager.getByRole("tab", { name: /^Controls/ }).click();
    await manager.locator("#control-initialCount").focus();
    await page.keyboard.press("Home");
    for (let count = 0; count < 3; count++) await page.keyboard.press("ArrowRight");
    await story.getByText("Changes saved 3 times", { exact: true }).waitFor();
    await manager.getByRole("link", { name: "Checkbox", exact: true }).click();
    const checkbox = story.getByRole("checkbox", { name: "Subscribe to updates" });
    await checkbox.waitFor();
    assert.equal(await checkbox.isChecked(), true);
    await checkbox.uncheck();
    assert.equal(await checkbox.isChecked(), false);

    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "the embed fits a narrow page",
    );
    await page.getByRole("link", { name: "Skip the interactive Storybook" }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), "after-storybook");
    assert.deepEqual(errors, []);
  },
);
