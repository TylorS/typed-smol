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

## Runtime Layers

Server-aware stories can provide Effect layers through Storybook parameters:

```ts
import * as Layer from "effect/Layer";
import { defineTypedStoryRuntime, type Meta, type StoryObj } from "@typed/storybook";

const meta = {
  title: "Example/Server Backed",
  parameters: {
    typed: defineTypedStoryRuntime({
      layers: [Layer.succeed(Service, implementation)] as const,
      url: "http://localhost/example",
    }),
  },
} satisfies Meta;

export default meta;

export const ServerBacked = {
  render: () => View,
} satisfies StoryObj;
```

The first harness boundary is intentionally in-memory and deterministic. It
proves that Typed template stories can run against real Effect services during
Storybook rendering and portable tests. Route-handler and HttpApi fixtures are
next hardening targets.

## Portable Stories

```ts
import projectAnnotations from "@typed/storybook/preview.js";
import { composeStory, setProjectAnnotations } from "@typed/storybook/testing";
import meta, { ServerBacked } from "./server-backed.stories";

setProjectAnnotations(projectAnnotations);

const Story = composeStory(ServerBacked, meta, projectAnnotations);
await Story.run({ canvasElement });
```
