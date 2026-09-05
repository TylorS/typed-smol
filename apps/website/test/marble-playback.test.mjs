import assert from "node:assert/strict";
import { dev, preview } from "astro";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = (process.env.SITE_BASE ?? "/typed-smol/").replace(/\/$/u, "");

test(
  "marble timelines share a clock, play at adjustable speed, and remain usable on mobile and without motion",
  { timeout: 120000 },
  async (t) => {
    const cacheDir = process.env.MARBLE_DEV
      ? await mkdtemp(join(tmpdir(), "typed-marble-test-"))
      : undefined;
    const server = await (process.env.MARBLE_DEV ? dev : preview)({
      root,
      ...(cacheDir ? { cacheDir } : {}),
      server: { host: "127.0.0.1", port: 0 },
      logLevel: "silent",
      vite: { server: { watch: null, hmr: false } },
    });
    t.after(async () => {
      await server.stop();
      if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
    });
    const origin = `http://127.0.0.1:${"address" in server ? server.address.port : server.port}`;
    const browser = await chromium.launch();
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      colorScheme: "dark",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}${base}/explore/fx-operator-atlas/`);
    await page.waitForFunction(() =>
      [...document.querySelectorAll("astro-island")].every((island) => !island.hasAttribute("ssr")),
    );
    await page.evaluate(() => document.fonts.ready);
    const figure = page.locator('.fx-marble[data-fx-operators="switchMap"]');
    await figure.scrollIntoViewIfNeeded();
    await figure.locator('[data-action="play"]').waitFor();
    assert.equal(await figure.getAttribute("data-enhanced"), "true");
    const range = figure.getByRole("slider", { name: "Timeline position" });
    await range.focus();
    assert.equal(
      await range.evaluate((node) => document.activeElement === node),
      true,
      "scrubber receives keyboard focus",
    );
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    assert.equal(await range.inputValue(), "1");
    await figure.getByRole("button", { name: "Return to the first tick" }).click();
    assert.equal(await range.inputValue(), "0");

    if (process.env.MARBLE_SCREENSHOT)
      await figure.screenshot({
        path: process.env.MARBLE_SCREENSHOT.replace("-mobile", "-desktop"),
      });
    // Browser clock makes a half-tick boundary deterministic; RAF remains the real implementation.
    await page.clock.install();
    await figure.getByRole("button", { name: "Play", exact: true }).click();
    await page.clock.runFor(1000);
    const halfway = await figure.evaluate((node) =>
      Number(node.style.getPropertyValue("--fx-marble-time")),
    );
    assert(
      halfway > 0.45 && halfway < 0.55,
      `one second at 0.5x must be half a tick, got ${halfway}`,
    );
    assert.equal(await range.inputValue(), "0");
    await page.clock.runFor(1050);
    assert.equal(
      await range.inputValue(),
      "1",
      JSON.stringify(
        await figure.evaluate((node) => ({
          playing: node.dataset.playing,
          time: node.style.getPropertyValue("--fx-marble-time"),
          bounds: node.getBoundingClientRect().toJSON(),
          hidden: document.hidden,
        })),
      ),
    );
    await figure.getByRole("button", { name: "Pause", exact: true }).click();
    const paused = await figure.evaluate((node) => node.style.getPropertyValue("--fx-marble-time"));
    await page.clock.runFor(3000);
    assert.equal(
      await figure.evaluate((node) => node.style.getPropertyValue("--fx-marble-time")),
      paused,
    );
    await figure.getByLabel("Playback speed").selectOption("0.25");
    await figure.getByRole("button", { name: "Return to the first tick" }).click();
    await figure.getByRole("button", { name: "Play", exact: true }).click();
    await page.clock.runFor(2000);
    const quarterSpeed = await figure.evaluate((node) =>
      Number(node.style.getPropertyValue("--fx-marble-time")),
    );
    assert(quarterSpeed > 0.45 && quarterSpeed < 0.55);
    await figure.getByRole("button", { name: "Pause", exact: true }).click();

    // Long labels and payloads must stay inside their own cells on the common grid.
    const issues = await page.locator(".fx-marble").evaluateAll((figures) =>
      figures.flatMap((node) => {
        const events = [...node.querySelectorAll(".fx-marble__event")];
        const steps = Number(node.querySelector(".fx-marble__diagram").dataset.ticks);
        return events.flatMap((event) => {
          const rect = event.getBoundingClientRect();
          const track = event.parentElement.getBoundingClientRect();
          const tick = Number(event.dataset.tick);
          const center = track.left + (track.width * (tick + 0.5)) / steps;
          return Math.abs(rect.x + rect.width / 2 - center) > 1 ||
            rect.width > track.width / steps ||
            event.scrollWidth > event.clientWidth + 1
            ? [`${node.dataset.fxOperators}: ${event.textContent} at ${tick}`]
            : [];
        });
      }),
    );
    assert.deepEqual(
      issues,
      [],
      "every atlas event must share tick centers and fit within its cell",
    );

    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.setViewportSize({ width: 390, height: 844 });
    await figure.scrollIntoViewIfNeeded();
    await figure.getByRole("button", { name: "Return to the first tick" }).click();
    await figure.getByLabel("Playback speed").selectOption("0.5");
    await figure.getByRole("button", { name: "Play", exact: true }).click();
    await page.clock.runFor(1000);
    assert.equal(
      await figure.evaluate((node) => node.style.getPropertyValue("--fx-marble-time")),
      "0",
    );
    assert.equal(
      await figure
        .locator('[data-phase="current"]')
        .first()
        .evaluate((node) => getComputedStyle(node).animationName),
      "none",
    );
    await page.clock.runFor(1100);
    assert.equal(
      await range.inputValue(),
      "1",
      JSON.stringify(
        await figure.evaluate((node) => ({
          playing: node.dataset.playing,
          time: node.style.getPropertyValue("--fx-marble-time"),
          bounds: node.getBoundingClientRect().toJSON(),
        })),
      ),
    );
    await figure.getByRole("button", { name: "Pause", exact: true }).click();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.equal(await figure.locator(".fx-marble__speed > span").isVisible(), false);
    const controlOverflow = await figure
      .locator(".fx-marble__controls")
      .evaluate((node) => node.scrollWidth > node.clientWidth);
    assert.equal(controlOverflow, false);
    // Following stays inside the horizontal timeline; controls retain keyboard focus.
    const assertCurrentTickVisible = async () => {
      const bounds = await figure.evaluate((node) => {
        const viewport = node.querySelector(".fx-marble__viewport").getBoundingClientRect();
        const label = node.querySelector(".fx-marble__label").getBoundingClientRect();
        return [...node.querySelectorAll('[data-phase="current"]')].map((event) => {
          const rect = event.getBoundingClientRect();
          return {
            text: event.textContent,
            visible: rect.left >= label.right - 1 && rect.right <= viewport.right + 1,
          };
        });
      });
      assert(bounds.length > 0);
      assert(
        bounds.every((event) => event.visible),
        JSON.stringify(bounds),
      );
    };
    await range.focus();
    const outerScroll = await page.evaluate(() => window.scrollY);
    await page.keyboard.press("End");
    assert.equal(await range.inputValue(), "6");
    await assertCurrentTickVisible();
    assert.equal(await range.evaluate((node) => document.activeElement === node), true);
    assert.equal(await page.evaluate(() => window.scrollY), outerScroll);
    const viewport = figure.locator(".fx-marble__viewport");
    assert((await viewport.evaluate((node) => node.scrollLeft)) > 0);
    await page.keyboard.press("Home");
    assert.equal(await viewport.evaluate((node) => node.scrollLeft), 0);
    await viewport.evaluate((node) => {
      node.scrollLeft = 40;
    });
    await page.clock.runFor(1000);
    assert.equal(
      await viewport.evaluate((node) => node.scrollLeft),
      40,
      "paused manual scrolling stays free",
    );
    await figure.getByRole("button", { name: "Next tick" }).click();
    await assertCurrentTickVisible();
    await figure.getByRole("button", { name: "Return to the first tick" }).click();
    const playButton = figure.locator('[data-action="play"]');
    await playButton.click();
    const playingOuterScroll = await page.evaluate(() => window.scrollY);
    await page.clock.runFor(12050);
    assert.equal(await range.inputValue(), "6");
    await assertCurrentTickVisible();
    assert.equal(await playButton.evaluate((node) => document.activeElement === node), true);
    assert.equal(await page.evaluate(() => window.scrollY), playingOuterScroll);
    if (process.env.MARBLE_SCREENSHOT)
      await figure.screenshot({ path: process.env.MARBLE_SCREENSHOT });
    assert.deepEqual(errors, []);

    const staticPage = await browser.newPage({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    await staticPage.goto(`${origin}${base}/explore/fx-operator-atlas/`);
    const staticFigure = staticPage.locator('.fx-marble[data-fx-operators="switchMap"]');
    assert.equal(await staticFigure.locator(".fx-marble__controls").isVisible(), false);
    assert.equal(await staticFigure.locator(".fx-marble__event").first().isVisible(), true);
    assert.equal(await staticFigure.locator(".fx-marble__legend").isVisible(), true);
  },
);
