import * as Component from "@typed/astro/Component";
import { Button } from "@typed/ui/Button";
import { Effect } from "effect";

export default Component.make(() =>
  Button({
    content: "◐",
    props: {
      class: "btn btn-ghost btn-square theme-toggle",
      "aria-label": "Switch color theme",
      title: "Switch light / dark theme",
    },
    onclick: Effect.sync(() => {
      const theme = document.documentElement.dataset.theme === "matrix" ? "matrix-light" : "matrix";
      document.documentElement.dataset.theme = theme;
      try {
        localStorage.setItem("typed-theme", theme);
      } catch {
        /* The current page still works without storage. */
      }
    }),
  }),
);
