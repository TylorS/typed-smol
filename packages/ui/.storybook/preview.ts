import type { Preview } from "@storybook/html-vite";
import "./preview.css";

const preview = {
  parameters: {
    a11y: {
      options: {
        runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
      },
      test: "error",
    },
    layout: "fullscreen",
  },
} satisfies Preview;

export default preview;
