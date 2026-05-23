import { describe, expect, it } from "vitest";
import { createStorybookVirtualModulePlugin } from "./StorybookVirtualModulePlugin.js";

const importer = "/project/src/story.ts";

function buildStorybook(id: string) {
  return createStorybookVirtualModulePlugin().build(id, importer, {} as never);
}

describe("StorybookVirtualModulePlugin", () => {
  it("resolves typed:storybook modules", () => {
    const plugin = createStorybookVirtualModulePlugin();

    expect(plugin.shouldResolve("typed:storybook/preview", importer)).toBe(true);
    expect(plugin.shouldResolve("typed:storybook/testing", importer)).toBe(true);
    expect(plugin.shouldResolve("typed:storybook/runtime?routes=./routes", importer)).toBe(true);
    expect(plugin.shouldResolve("typed:router?dir=./routes", importer)).toBe(false);
  });

  it("emits preview and testing helpers", () => {
    expect(buildStorybook("typed:storybook/preview")).toBe(
      'export { default, projectAnnotations, renderToCanvas } from "@typed/storybook/preview.js";\n',
    );
    expect(buildStorybook("typed:storybook/testing")).toContain(
      'export { composeStories, composeStory, setProjectAnnotations } from "@typed/storybook/testing";',
    );
  });

  it("emits runtime imports for route and api targets", () => {
    const source = buildStorybook(
      "typed:storybook/runtime?routes=./routes&routes=./admin&api=./api&path=/dashboard&serverOrigin=http%3A%2F%2F127.0.0.1%3A6174&proxyPath=%2F__typed_storybook_api",
    ) as string;

    expect(source).toContain('import Routes0 from "typed:router?dir=./routes";');
    expect(source).toContain('import Routes1 from "typed:router?dir=./admin";');
    expect(source).toContain('import * as Api0 from "typed:api?dir=./api&mode=client";');
    expect(source).not.toContain("typed:server");
    expect(source).toContain("export const Routes = TypedRouter.merge(Routes0, Routes1);");
    expect(source).toContain('path: "/dashboard"');
    expect(source).toContain('serverOrigin: "http://127.0.0.1:6174"');
    expect(source).toContain('proxyPath: "/__typed_storybook_api"');
  });

  it("composes generated layers before story layers and leaves test layers last", () => {
    const source = buildStorybook("typed:storybook/runtime?routes=./routes&api=./api") as string;

    expect(source).toContain("export const apiLayers = [] as const;");
    expect(source).toContain("export const DependenciesLayer = Layer.empty;");
    expect(source).toContain("const generatedLayers = [] as const;");
    expect(source).not.toContain("Api0.ApiLayer");
    expect(source).toContain(
      "export function makeStoryRuntime<const Options extends StoryRuntimeOptions = {}>",
    );
    expect(source).toContain(
      "layers: [...generatedLayers, ...(options.layers ?? [])] as const",
    );
    expect(source).toContain("readonly testLayers?: readonly LayerOrGroup[];");
    expect(source).toContain("...options,");
  });
});
