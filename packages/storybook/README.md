# @typed/storybook

First-party Storybook framework integration for Typed.

## Configuration

```ts
import {
  TYPED_STORYBOOK_FRAMEWORK,
  defineTypedStorybookConfig,
} from "@typed/storybook";

export default defineTypedStorybookConfig({
  stories: ["../src/**/*.stories.ts"],
  framework: {
    name: TYPED_STORYBOOK_FRAMEWORK,
    options: {
      server: { mode: "runtime-harness" },
    },
  },
});
```

The preset selects Storybook's Vite builder and appends `typedVitePlugin()` so
stories use Typed's normal virtual-module path.

## Path-Based Runtime

Stories can import generated route/API metadata from `@typed/app` Storybook
virtual modules:

```ts
import { parameters, Routes } from "typed:storybook/runtime?routes=./routes&api=./api&path=/dashboard";
import type { Meta, StoryObj } from "@typed/storybook";

const meta = {
  title: "Example/Dashboard",
  parameters,
} satisfies Meta;

export default meta;

export const Dashboard = {
  render: () => Routes,
} satisfies StoryObj;
```

Supported runtime options are `routes`, `api`, `path`, `layers`, `testLayers`,
`serverOrigin`, and `proxyPath`. There is no `url` option. `path` is only the
initial in-memory route path for `TypedRouter.TestRouter`.

`testLayers` are applied with override precedence in portable/executable
stories:

```ts
import * as Layer from "effect/Layer";
import { makeStoryRuntime } from "typed:storybook/runtime?routes=./routes";

export const WithFakeRepo = {
  parameters: {
    typed: makeStoryRuntime({
      testLayers: [Layer.succeed(UserRepo, fakeUserRepo)] as const,
    }),
  },
};
```

## HTTP Server Mode

API-backed stories can run against a real generated Typed HTTP server during
Storybook dev:

```ts
export default defineTypedStorybookConfig({
  stories: ["../src/**/*.stories.ts"],
  framework: {
    name: TYPED_STORYBOOK_FRAMEWORK,
    options: {
      server: {
        mode: "http-server",
        routes: ["./src/routes"],
        api: ["./src/api"],
        host: "127.0.0.1",
        port: 6174,
        proxyPath: "/__typed_storybook_api",
      },
    },
  },
});
```

Stories should call APIs through the same-origin helper:

```ts
import { typedStorybookFetch } from "@typed/storybook";

const response = await typedStorybookFetch("/message", context.parameters);
```

## Portable Stories

```ts
import projectAnnotations from "@typed/storybook/preview.js";
import { composeStory, setProjectAnnotations } from "@typed/storybook/testing";
import meta, { ServerBacked } from "./server-backed.stories";

setProjectAnnotations(projectAnnotations);

const Story = composeStory(ServerBacked, meta, projectAnnotations);
await Story.run({ canvasElement });
```

The public-beta fixture in `fixtures/public-beta` covers generated route
rendering, API proxy fetches, and explicit `testLayers` overrides. It is outside
the package publish allowlist.

## Story Tests

The fixture includes Storybook's Vitest addon configuration using
`@storybook/addon-vitest` and Vitest browser mode. `test:stories` starts the
fixture Storybook dev server, runs the addon-generated browser story tests
against it, and then tears the server down.
