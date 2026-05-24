import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import type { Meta, StoryObj } from "@typed/storybook";
import type { RealWorldClient } from "./Api.js";
import { ApiClient, decodedRouteApiClient } from "./common/routeData.js";
import {
  Routes,
  apiBaseUrl,
  makeStoryRuntime,
  makeTypedClient,
} from "typed:storybook/runtime?path=/";

const StorybookApiLayer = ApiClient.layer(
  Effect.map(makeTypedClient({ baseUrl: apiBaseUrl }), (client) =>
    decodedRouteApiClient(client as RealWorldClient),
  ),
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
