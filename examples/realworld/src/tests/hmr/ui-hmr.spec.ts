import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const projectRoot = resolve(import.meta.dirname, "../../..");
const fixturePath = resolve(projectRoot, "src/tests/hmr/fixture.ts");

let originalClientSource: string | undefined;

test.afterEach(() => {
  if (originalClientSource) {
    writeFileSync(fixturePath, originalClientSource);
    originalClientSource = undefined;
  }
});

test("preserves @typed/ui state across a template-only HMR update", async ({ page }) => {
  originalClientSource = readFileSync(fixturePath, "utf8");
  const nextTitle = `Typed UI HMR after ${Date.now()}`;
  const nextCompiledTitle = `Typed compiler HMR after ${Date.now()}`;

  await page.goto("/");
  await expect(page.getByTestId("compiled-title")).toHaveText("Typed compiler HMR before");
  await expect(page.getByTestId("hmr-title")).toHaveText("Typed UI HMR before");

  await page.getByRole("button", { name: "Toggle disclosure" }).click();
  await expect(page.getByText("Disclosure state survived")).toBeVisible();
  await page.getByRole("button", { name: "Open select" }).click();
  await page.getByRole("option", { name: "Personal" }).click();
  await expect(page.getByTestId("hmr-select-value")).toHaveText("personal");

  writeFileSync(
    fixturePath,
    originalClientSource
      .replace("Typed compiler HMR before", nextCompiledTitle)
      .replace("Typed UI HMR before", nextTitle),
  );

  await expect(page.getByTestId("compiled-title")).toHaveText(nextCompiledTitle);
  await expect(page.getByTestId("hmr-title")).toHaveText(nextTitle);
  await expect(page.getByText("Disclosure state survived")).toBeVisible();
  await expect(page.getByTestId("hmr-select-value")).toHaveText("personal");
});
