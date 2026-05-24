import type { Preview } from "@typed/storybook";
import "../src/common/styles.css";

const preview = {
  parameters: {
    layout: "fullscreen",
  },
} satisfies Preview;

export default preview;
