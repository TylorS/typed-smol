import type { Meta, StoryObj } from "@typed/storybook";
import { Banner } from "./common/components/Banner.js";
import { Navbar } from "./common/components/Navbar.js";

const meta = {
  title: "RealWorld/Shell",
} satisfies Meta;

export default meta;

export const BannerStory = {
  render: () => Banner,
} satisfies StoryObj;

export const NavbarStory = {
  render: () => Navbar,
} satisfies StoryObj;
