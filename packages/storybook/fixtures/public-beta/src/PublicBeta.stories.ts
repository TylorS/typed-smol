import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import { html } from "@typed/template";
import { type Meta, type StoryObj } from "@typed/storybook";
import {
  InputArbitrary,
  InputArbitraryLazy,
  InputEquivalence,
  InputFormatter,
  InputJsonSchema,
  InputRepresentation,
  InputSchema,
  InputStandardJsonSchema,
  InputStandardSchema,
  argTypes as userCardArgTypes,
  makeComponentProperty,
  makeComponentStory,
  type Input as UserCardInput,
} from "typed:component?path=./components/UserCard.ts";
import {
  makeComponentStory as makeServiceComponentStory,
  type Input as ServiceCardInput,
} from "typed:component?path=./components/ServiceCard.ts";
import {
  Routes,
  apiBaseUrl,
  makeStoryRuntime,
  parameters,
} from "typed:storybook/runtime?path=/dashboard";
import { makeTypedClient } from "typed:api?dir=./api&mode=client";
import { ApiMessage } from "./api/_dependencies.js";
import { ComponentGreeting } from "./components/ServiceCard.js";

const userCardInput: UserCardInput = {
  featured: true,
  user: {
    name: "Ada Lovelace",
    role: "admin",
  },
  visits: 42,
};

const serviceCardInput: ServiceCardInput = {
  label: "Component dependency",
};

export const userCardArbitrary = InputArbitrary;
export const userCardProperty = makeComponentProperty({
  assert: (_input, result) => {
    if (result === undefined) {
      throw new Error("Generated inputs must construct a component result");
    }
  },
});

const meta = {
  title: "Typed/Public Beta",
  tags: ["test"],
  includeStories: [
    "RouteBacked",
    "ComponentBacked",
    "ComponentSchemaUtilities",
    "ComponentTestLayerOverride",
    "ApiBacked",
    "ApiTestLayerOverride",
  ],
  parameters,
} satisfies Meta;

export default meta;

export const RouteBacked = {
  render: () => Routes,
} satisfies StoryObj;

export const ComponentBacked = {
  ...makeComponentStory({
    input: userCardInput,
    testLayers: [] as const,
  }),
  argTypes: userCardArgTypes,
} satisfies StoryObj<UserCardInput>;

export const ComponentSchemaUtilities = {
  render: () => {
    const equivalence = InputEquivalence(userCardInput, userCardInput);
    const utilities = [
      InputSchema,
      InputArbitrary,
      InputArbitraryLazy,
      InputFormatter,
      InputRepresentation,
      InputJsonSchema,
      InputStandardSchema,
      InputStandardJsonSchema,
      userCardArgTypes,
    ];

    return html`<output data-testid="component-schema">
      ${equivalence ? "schema utilities ready" : "schema utilities failed"}:${utilities.length}
    </output>`;
  },
} satisfies StoryObj;

export const ComponentTestLayerOverride = makeServiceComponentStory({
  input: serviceCardInput,
  testLayers: [
    Layer.succeed(ComponentGreeting, {
      message: "Satisfied by component testLayers",
    }),
  ] as const,
}) satisfies StoryObj<ServiceCardInput>;

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
