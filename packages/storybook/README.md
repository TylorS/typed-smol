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
      server: {
        mode: "http-server",
        routes: ["./src/routes"],
        api: ["./src/api"],
      },
    },
  },
});
```

The preset selects Storybook's Vite builder and appends `typedVitePlugin()` so
stories use Typed's normal virtual-module path. In HTTP-server mode, these
framework options also become the defaults for Storybook runtime virtual modules,
so stories can use short imports instead of repeating route/API/proxy metadata.

## Path-Based Runtime

Stories can import generated route/API metadata from `@typed/app` Storybook
virtual modules:

```ts
import { parameters, Routes } from "typed:storybook/runtime?path=/dashboard";
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

Supported runtime query options are `routes`, `api`, `path`, `serverOrigin`,
and `proxyPath`. There is no `url` option. `path` is only the initial
in-memory route path for `TypedRouter.TestRouter`.

Prefer `typed:storybook/runtime?path=/...` in stories. Use explicit
`routes=./routes&api=./api` only when a story intentionally targets a different
route/API tree than the framework defaults.

## Component Stories

Component-level stories can import generated input/schema helpers from
`typed:component`. The default export is used unless an `export=` query option
is provided:

```ts
import {
  InputArbitrary,
  InputSchema,
  makeComponentStory,
  type Input,
} from "typed:component?path=./components/UserCard.ts";

const input: Input = {
  user: { name: "Ada Lovelace", role: "admin" },
  visits: 42,
};

export const UserCard = makeComponentStory({ input });

void InputSchema;
void InputArbitrary;
```

When input properties are derived from local `effect/Schema` values, the
component VM reuses those schema exports. Missing primitive/object fields are
generated from TypeInfo, and the VM also exports arbitrary, lazy arbitrary,
equivalence, formatter, representation, JSON Schema, and Standard Schema
conveniences for component testing.

`testLayers` are applied with override precedence in portable/executable
stories:

```ts
import * as Layer from "effect/Layer";
import { makeStoryRuntime } from "typed:storybook/runtime?path=/dashboard";

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

Stories should call APIs through generated `typed:api` clients:

```ts
import * as Effect from "effect/Effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { apiBaseUrl } from "typed:storybook/runtime?path=/dashboard";
import { makeClient } from "typed:api?dir=./api&mode=client";

const message = Effect.gen(function* () {
  const client = yield* makeClient({ baseUrl: apiBaseUrl });
  return yield* client.root.message();
}).pipe(Effect.provide(FetchHttpClient.layer));
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

Use `test:portable` for direct executable story tests that do not boot a
Storybook dev server.

## Story Tests

The fixture includes Storybook's Vitest addon configuration using
`@storybook/addon-vitest` and Vitest browser mode. `test:stories` starts the
fixture Storybook dev server, runs the addon-generated browser story tests
against it, and then tears the server down.

Use `test:stories` for server-backed Storybook tests that need the Typed HTTP
server and Storybook proxy.
