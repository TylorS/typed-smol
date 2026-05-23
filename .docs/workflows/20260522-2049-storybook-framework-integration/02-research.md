## Research Questions

1. What does current Storybook expect from a first-party framework package?
2. Which Storybook testing APIs must a Typed framework package support for portable stories and interaction tests?
3. What can be learned from current meta-framework integrations such as Next.js with Vite and SvelteKit?
4. Which parts of the old `@typed/storybook` package remain useful?
5. Which current Typed runtime surfaces should shape the first server-aware Storybook requirements?

## Source Table

| source | year | type | confidence | notes |
| ------ | ---- | ---- | ---------- | ----- |
| https://storybook.js.org/docs/contribute/framework | 2026 | official docs | high | Defines Storybook framework packages as meta-framework or renderer-plus-builder integrations and says meta-framework integrations recreate framework behavior. |
| https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest | 2026 | official docs | high | Defines portable stories, `composeStories`, `composeStory`, `setProjectAnnotations`, and `run()` as the testable story pipeline. |
| https://storybook.js.org/docs/get-started/frameworks/nextjs-vite/ | 2026 | official docs | high | Shows Storybook's current recommended Vite-based Next.js integration and framework package setup. |
| https://storybook.js.org/docs/9.0/get-started/frameworks/sveltekit | 2025 | official docs | medium | Documents SvelteKit framework behavior and the limits of client-only Storybook for private server env features. Versioned 9.0 page, but useful for meta-framework constraints. |
| https://storybook.js.org/docs/builders/vite | 2026 | official docs | high | Establishes Vite builder configuration and `viteFinal` customization as the integration point for Vite projects. |
| https://github.com/TylorS/typed/tree/development/packages/storybook | 2024-era | old implementation | medium | Old renderer package reference; useful for lifecycle ideas but based on Storybook 8 and old Typed packages. |
| `packages/app/src/ServerVirtualModulePlugin.ts` and `packages/app/src/internal/emitServerSource.ts` | 2026 | local code | high | Current `typed:server` generation path for SSR, route modules, Api layers, static assets, and app layers. |
| `packages/app/src/BrowserVirtualModulePlugin.ts` and `packages/app/src/internal/emitBrowserSource.ts` | 2026 | local code | high | Current `typed:browser` generation path for hydration, browser router state, root resolution, and app layers. |
| `packages/vite-plugin/src/index.ts` | 2026 | local code | high | Current `typedVitePlugin()` integration and all-app-VM-plugin registration invariant. |
| `packages/ui/src/HttpRouter.ts` | 2026 | local code | high | Current SSR-to-HTTP route bridge and request-context rendering path. |

## WebSearch Query Log

| query | rationale | selected_sources |
| ----- | --------- | ---------------- |
| `site:storybook.js.org/docs Storybook Next.js framework @storybook/nextjs-vite Storybook 10` | Verify current Next.js/Vite framework guidance. | Storybook Next.js with Vite docs |
| `site:storybook.js.org/docs Storybook SvelteKit framework Storybook 10` | Compare meta-framework integration responsibilities and server limits. | Storybook SvelteKit docs |
| `site:storybook.js.org/docs portable stories composeStories Storybook 10 Vitest` | Verify portable story testing APIs. | Portable Stories in Vitest docs |
| `site:storybook.js.org/docs framework package renderToCanvas Storybook custom framework` | Verify framework package and renderer expectations. | Contributing a Storybook framework docs; Frameworks API docs |

## Key Findings

- Storybook's framework concept is the right product category for Typed. Current docs define a framework as either a meta-framework integration or a builder-plus-renderer integration, and meta-framework integrations carry extra configuration to make Storybook behave like generated apps.
- Portable stories are a required design target. Storybook's testing model expects project annotations, story composition, and `run()` to recreate the story pipeline outside the UI.
- Vite integration should be first-class. Storybook's Vite builder exposes `viteFinal`, and Typed already centralizes app virtual modules through `typedVitePlugin()`.
- The SvelteKit integration shows a cautionary boundary: client-only Storybook can mock framework modules, but server-only features are limited or unsupported. Typed's requested goal is explicitly to avoid stopping at that boundary.
- The old `@typed/storybook` renderer is useful mainly as a lifecycle reference: it converts story output into a Typed `Fx`, installs browser render services, and interrupts the fiber on unmount. It does not define a server-aware framework surface.
- Current Typed already has server/browser virtual modules and SSR HTTP integration. The Storybook design should reuse or factor these paths rather than building a parallel runtime.

## Open Risks and Unknowns

- Storybook's static build model may limit server-backed stories unless Typed provides an in-memory harness or a dev-server-only runtime mode.
- Real local HTTP server integration may provide the best fidelity but could make stories slower, port-sensitive, and harder to run in CI.
- An in-memory harness is likely faster and more testable, but it must accurately model request context, layers, routing, and HttpApi behavior.
- The first fixture must be small enough to keep implementation tractable while still proving server-side code with UI.
- We have not yet selected the exact Storybook major target or dependency range for package metadata.

## Implications for Requirements and Specification

- Requirements should define `@typed/storybook` as a Storybook framework package, not just a renderer.
- Requirements should require `typedVitePlugin()` integration through Storybook's Vite config path.
- Requirements should include portable story APIs and Vitest support as first-class acceptance criteria.
- Requirements should include at least one server-backed story path that exercises real Typed server code through app layers, routing, or HttpApi.
- Requirements should force an explicit decision among in-memory harness, Storybook middleware, and real local server execution models before implementation.
- Requirements should preserve virtual-module-first usage and forbid local `typed:*` shims in fixtures.

## Alignment Notes

- specs_alignment:
  - Router and HttpApi virtual module specs remain the source of truth for generated route/API surfaces.
  - `typed-config` remains the source of truth for config exposure.
- adrs_alignment:
  - Aligns with virtual-module-first framework evolution.
  - Aligns with the one-server Typed development direction from the vavite-backed HTTP server ADR, while leaving Storybook-specific execution mode undecided.
- workflows_alignment:
  - Builds on typed framework evolution and RealWorld workflow findings.
  - Treats old `@typed/storybook` as a reference-only implementation, matching Phase 1 scope.

## Memory Promotion Candidates

- procedural: Future Storybook work should start from the framework-package contract, not `renderToCanvas` alone. Confidence: high.
- heuristic: The first implementation tranche should prove one server-backed story workflow end to end before adding broad visual/demo affordances. Confidence: medium.
- mistake: Do not let the SvelteKit-style client-only mocking boundary become Typed's default; the user explicitly wants server-side code tested with UI. Confidence: high.
