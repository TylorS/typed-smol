import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { html } from "@typed/template";
import { makeStoryRuntime } from "typed:storybook/runtime?path=/server-backed";
import type { Meta, StoryObj } from "../index.js";

class SaveMessage extends Context.Service<SaveMessage, { readonly text: string }>()(
  "test/storybook/SaveMessage",
) {}

const meta = {
  title: "Typed/Server Backed",
  parameters: {
    typed: makeStoryRuntime({
      testLayers: [Layer.succeed(SaveMessage, { text: "Saved from server" })] as const,
    }),
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const ServerBacked = {
  render: () => html`<button>${SaveMessage.pipe(Effect.map((message) => message.text))}</button>`,
} satisfies Story;
