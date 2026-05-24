import type { Meta, StoryObj } from "@typed/storybook";
import { Routes, makeStoryRuntime } from "typed:storybook/runtime?path=/";
import { StorybookApiLayer } from "./storyLayers.js";

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
