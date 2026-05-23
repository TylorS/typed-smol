## Status

Accepted

## Context

Typed needs a Storybook integration that can test UI with server-side code. Storybook meta-framework packages are expected to recreate framework behavior, but Storybook's static/client-oriented model can make real server features hard to represent.

The old `@typed/storybook` package only proved canvas rendering. It did not define a server-aware story runtime.

Typed already has reusable app surfaces: `typed:server`, `typed:browser`, `@typed/vite-plugin`, router virtual modules, HttpApi virtual modules, `TypedHttpServer`, and SSR helpers. The first Storybook tranche should reuse these without forcing every story through a real local HTTP server.

## Decision

Use a Typed runtime harness as the first server-aware Storybook execution model.

The harness will:

- compose app layers and story layers per story run;
- provide router/navigation state and request context;
- expose server-side Typed behavior to UI interactions in portable tests;
- remain compatible with Storybook's `composeStories` and `run()` pipeline;
- avoid local `typed:*` shims and hidden filesystem routing.

Storybook dev-server middleware integration and real local HTTP server execution remain future fidelity layers, not first-tranche defaults.

## Consequences

- The first tranche can be deterministic and CI-friendly.
- Portable stories become a first-class acceptance target.
- The harness must stay close to `@typed/app` runtime behavior to avoid a fake server model.
- A later e2e/smoke layer is still needed to prove parity with real Typed HTTP serving.

## Alternatives considered

- Renderer-only port of the old package:
  - Rejected because it repeats the browser-only boundary and fails the server-side testing goal.
- Storybook dev-server middleware first:
  - Deferred because it is higher fidelity but more operationally complex.
- Real local Typed HTTP server first:
  - Deferred because it is slower, port-sensitive, and less portable-test-friendly.

## References

- `.docs/workflows/20260522-2049-storybook-framework-integration/requirements.md`
- `.docs/specs/storybook-framework-integration/spec.md`
- `.docs/specs/storybook-framework-integration/testing-strategy.md`
- `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
- `.docs/adrs/20260516-1643-vavite-backed-typed-http-server.md`
- https://storybook.js.org/docs/contribute/framework
- https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest
