import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { html } from "@typed/template";
import { type Meta, type StoryObj } from "@typed/storybook";
import {
  Routes,
  apiBaseUrl,
  makeStoryRuntime,
  parameters,
} from "typed:storybook/runtime?routes=./routes&api=./api&path=/dashboard&serverOrigin=http%3A%2F%2F127.0.0.1%3A6173&proxyPath=%2F__typed_storybook_api";
import { makeTypedClient } from "typed:api?dir=./api&mode=client";
import { ApiMessage } from "./api/_dependencies.js";

const meta = {
  title: "Typed/Public Beta",
  tags: ["test"],
  parameters,
} satisfies Meta;

export default meta;

export const RouteBacked = {
  render: () => Routes,
} satisfies StoryObj;

export const ApiBacked = {
  render: () =>
    html`<output data-testid="api-message">${Effect.gen(function* () {
      const client = yield* makeTypedClient({ baseUrl: apiBaseUrl });
      const body = yield* client.root.message();
      return body.message;
    }).pipe(Effect.provide(FetchHttpClient.layer))}</output>`,
} satisfies StoryObj;

export const ApiTestLayerOverride = {
  parameters: {
    typed: makeStoryRuntime({
      testLayers: [
        Layer.succeed(ApiMessage, {
          message: "Overridden by testLayers",
        }),
      ] as const,
    }),
  },
  render: () =>
    html`<output data-testid="api-test-layer">
      ${ApiMessage.pipe(Effect.map((service) => service.message))}
    </output>`,
} satisfies StoryObj;
