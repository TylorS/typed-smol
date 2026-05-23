import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { html } from "@typed/template";
import { defineTypedStoryRuntime, type Meta, type StoryObj } from "../index.js";

class SaveMessage extends Context.Service<SaveMessage, { readonly text: string }>()(
  "test/storybook/SaveMessage",
) {}

const meta = {
  title: "Typed/Server Backed",
  parameters: {
    typed: defineTypedStoryRuntime({
      layers: [Layer.succeed(SaveMessage, { text: "Saved from server" })] as const,
      url: "http://localhost/server-backed",
    }),
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const ServerBacked = {
  render: () => html`<button>${SaveMessage.pipe(Effect.map((message) => message.text))}</button>`,
} satisfies Story;
