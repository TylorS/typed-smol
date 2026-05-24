import type { Meta, StoryObj } from "@typed/storybook";
import { Banner } from "./common/components/Banner.js";
import { Navbar } from "./common/components/Navbar.js";
import { makeStoryRuntime } from "typed:storybook/runtime?path=/";

const meta = {
  title: "RealWorld/Shell",
  parameters: {
    typed: makeStoryRuntime(),
  },
} satisfies Meta;

export default meta;

export const BannerStory = {
  render: () => Banner,
} satisfies StoryObj;

export const NavbarStory = {
  render: () => Navbar,
} satisfies StoryObj;
