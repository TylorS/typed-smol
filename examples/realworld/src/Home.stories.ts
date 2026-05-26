import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import type { Meta, StoryObj } from "@typed/storybook";
import { ApiClient, decodedRouteApiClient } from "./common/routeData.js";
import { Routes, apiBaseUrl, makeClient, makeStoryRuntime } from "typed:storybook/runtime?path=/";

const StorybookApiLayer = ApiClient.layer(
  Effect.map(makeClient({ baseUrl: apiBaseUrl }), decodedRouteApiClient),
).pipe(Layer.provideMerge(FetchHttpClient.layer));

const meta = {
  title: "RealWorld/Home",
  parameters: {
    typed: makeStoryRuntime({
      testLayers: [StorybookApiLayer] as const,
    }),
  },
} satisfies Meta;

export default meta;

/** Seed the database first: `pnpm db:seed` */
export const Feed = {
  render: () => Routes,
} satisfies StoryObj;
