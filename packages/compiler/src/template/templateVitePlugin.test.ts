import { describe, expect, it } from "vitest";
import { typedTemplateVitePlugin } from "./templateVitePlugin.js";
import {
  invalidTemplateDiagnosticCode,
  invalidTemplateModuleSource,
} from "./templateFixtures.js";

describe("typedTemplateVitePlugin", () => {
  it("transforms typed html templates in Vite transform hooks", async () => {
    const plugin = typedTemplateVitePlugin();
    const sourceText = [
      'import { html } from "@typed/template";',
      "const name = 'Ada';",
      "export const view = html`<p>${name}</p>`;",
    ].join("\n");

    const result = await transform(plugin, sourceText, "/src/view.ts");

    expect(result).toMatchObject({ map: null });
    expect(result?.code).toContain("typedTemplatePlan");
    expect(result?.code).toContain("export const view = html(__typed_template_0, name);");
  });

  it("leaves modules unchanged when template transforms are disabled", async () => {
    const plugin = typedTemplateVitePlugin({ enabled: false });
    const sourceText = [
      'import { html } from "@typed/template";',
      "export const view = html`<p>Hi</p>`;",
    ].join("\n");

    await expect(transform(plugin, sourceText, "/src/view.ts")).resolves.toBeNull();
  });

  it("ignores non TypeScript and JavaScript module ids", async () => {
    const plugin = typedTemplateVitePlugin();
    const sourceText = 'import { html } from "@typed/template";\nhtml`<p>Hi</p>`;';

    await expect(transform(plugin, sourceText, "/src/view.css")).resolves.toBeNull();
  });

  it("reports template diagnostics through the Vite hook context", async () => {
    const warnings: string[] = [];
    const plugin = typedTemplateVitePlugin({ diagnostics: "warn" });

    await expect(
      transform(plugin, invalidTemplateModuleSource, "/src/view.ts", {
        warn: (message) => warnings.push(message),
        error: (error) => {
          throw new Error(String(error));
        },
      }),
    ).resolves.toBeNull();

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(invalidTemplateDiagnosticCode);
  });
});

async function transform(
  plugin: ReturnType<typeof typedTemplateVitePlugin>,
  sourceText: string,
  id: string,
  context: { warn(message: string): void; error(error: unknown): never } = {
    warn: () => {},
    error: (error) => {
      throw error;
    },
  },
): Promise<{ readonly code: string; readonly map: null } | null> {
  const hook = plugin.transform;
  if (typeof hook !== "function") throw new Error("Expected function transform hook.");
  return (await hook.call(context, sourceText, id)) as
    | { readonly code: string; readonly map: null }
    | null;
}
