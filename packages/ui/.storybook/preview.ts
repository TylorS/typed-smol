import type { Preview } from "@storybook/html-vite";
import "./preview.css";

const preview = {
  parameters: {
    a11y: {
      test: "error",
    },
    layout: "fullscreen",
  },
} satisfies Preview;

export default preview;
