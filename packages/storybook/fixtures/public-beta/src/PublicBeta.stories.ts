import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { html } from "@typed/template";
import {
  typedStorybookFetch,
  type Meta,
  type StoryContext,
  type StoryObj,
} from "@typed/storybook";
import {
  Routes,
  makeStoryRuntime,
  parameters,
} from "typed:storybook/runtime?routes=./routes&api=./api&path=/dashboard&serverOrigin=http%3A%2F%2F127.0.0.1%3A6173&proxyPath=%2F__typed_storybook_api";
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
  render: (_args: object, context: StoryContext) =>
    html`<output data-testid="api-message">${Effect.promise(async () => {
      const response = await typedStorybookFetch("/message", context.parameters);
      const body = (await response.json()) as { readonly message: string };
      return body.message;
    })}</output>`,
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
