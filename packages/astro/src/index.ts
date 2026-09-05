import type { AstroIntegration } from "astro";

/** Register Typed SSR and the browser renderer used by Astro's client directives. */
export default function typed(): AstroIntegration {
  return {
    name: "@typed/astro",
    hooks: {
      "astro:config:setup": ({ addRenderer }) => {
        addRenderer({
          name: "@typed/astro",
          serverEntrypoint: "@typed/astro/server",
          clientEntrypoint: "@typed/astro/client",
        });
      },
    },
  };
}
