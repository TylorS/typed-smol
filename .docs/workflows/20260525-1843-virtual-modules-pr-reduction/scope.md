# Scope

## In Scope

- Audit and converge current dirty-branch work that affects virtual modules, compiler output, app runtime, Vite/dev/preview/build, VS Code, TS plugin, DevTools, Storybook, and RealWorld.
- Define the minimum release slice for "virtual modules work across all surfaces" with concrete acceptance gates.
- Stabilize VS Code and `@typed/virtual-modules-ts-plugin` as first-class virtual-module hosts, including shared cached generated files, bounded invalidation, and no hot-path full-program work unless measured and cached.
- Stabilize Storybook as a first-class framework surface that consumes the same generated runtime, generated client, virtual-module, and DevTools contracts as application builds.
- Research and simplify configuration ownership across `typed.config.ts`, Vite plugin options, `vmc` config/loading, TypeScript plugin config, and VS Code integration.
- Optimize framework-level code paths by simplifying shared host/cache/compiler boundaries instead of adding surface-specific wrappers.
- Enforce type safety across generated virtual modules, framework helpers, compiler output, and public examples.
- Make all first-party virtual-module plugins production-build aware: emit only user-consumed imports and the transitive dependencies required by those imports.
- Make `typed:api?mode=client` generate and expose the raw `Client`, `Api`, `makeClient`, `makeClientWith`, and related raw `HttpApiClient` helpers without `TypedClient`, `TypedClientInput`, `makeTypedClient`, or wrapper mappings.
- Preserve generic endpoint function parameters, return types, errors, and service channels through `HttpApiClient.ForApi<typeof Api, E, R>` and `HttpClient.With<E, R>`.
- Define compiler truth requirements for:
  - module fact discovery;
  - optimized server HTML output;
  - optimized DOM output;
  - stateful HMR eligibility and rejection;
  - DevTools facts and source correlation.
- Define cross-surface verification for:
  - package-level unit/property tests;
  - `vmc` typecheck/build paths;
  - Vite dev mode;
  - Vite build and preview;
  - TS plugin hover/type-check responsiveness;
  - VS Code virtual module tree and preview behavior;
  - Storybook dev/build/runtime reliability;
  - shared config loading across Typed, Vite, `vmc`, TypeScript plugin, and VS Code;
  - import-pruned production output for each first-party virtual-module plugin;
  - type-level assertions for generated public API surfaces;
  - RealWorld acceptance;
  - Storybook where it proves runtime fidelity;
  - DevTools live panel/bridge behavior.
- Keep package ownership aligned with `.docs/adrs/20260524-runtime-cohesion-ownership-boundaries.md` and `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`.
- Use specialist subagent research for compiler/HMR, virtual-module host surfaces, DevTools, and generated client cleanup.

## Out Of Scope Unless Approved Later

- Replacing the Effect HttpApi client API.
- Adding filesystem routing or generated route files outside the virtual-module system.
- Creating a parallel Storybook runtime.
- Polishing DevTools UI before proving live data correctness.
- Broad public API churn unrelated to virtual modules, compiler/HMR, generated clients, or inspectability.
- Merging directly into the target branch; finalization strategy is PR.

## Initial Acceptance Direction

- No generated or public `TypedClient` abstraction remains in the accepted release slice.
- Generated HttpApi client source contains no endpoint wrapper mappings that erase generic parameters to `unknown` or `any`.
- Generated public surfaces must preserve concrete request, success, error, and service types without cast-based or mapped-wrapper erasure.
- Production builds must prove plugins do not emit unused generated imports, handlers, modules, or helper code outside the user import dependency closure.
- VS Code and TS plugin use the shared virtual-module artifact/cache contract efficiently enough to avoid duplicated generated files and unbounded recomputation.
- Storybook uses the same generated app/runtime/client contracts as production-like app surfaces, with no parallel runtime or stale fixture-only proof.
- Typed, Vite, `vmc`, TypeScript plugin, and VS Code configuration paths have a documented convergence plan and no newly introduced duplicated option plumbing.
- Framework-level paths are simpler after the work: fewer generated-client wrappers, fewer runtime handoff paths, fewer cache ownership paths, and clearer package reasons to change.
- The strongest final branch gate remains `pnpm build`, but release readiness also needs targeted RealWorld dev/build/preview/HMR/acceptance gates.
- DevTools panels must advertise only live capabilities wired from the inspected runtime; missing capabilities render explicit unavailable states.
- Compiler success must be measured by executable output and tests, not by the presence of compiler-looking package structure.

## Open Questions

- Which proof surface should be the first blocking gate: raw client cleanup, host-surface virtual-module parity, compiler/HMR truth, RealWorld preview, or DevTools liveness?
- Should this PR be reduced to one vertical slice that proves all surfaces lightly, or split into multiple PRs by ownership area?
- What is the minimum "better-than-hand-optimized" claim we are willing to encode as tests in this workflow: byte/operation counts, DOM mutation counts, server HTML shape, benchmark thresholds, or compiler IR invariants?
- What latency budget should we hold TS plugin and VS Code virtual-module operations to for hover, diagnostics, tree refresh, and preview open?
- Which config surface should be canonical for shared framework options, and which hosts should merely adapt that config?
- What is the exact dependency-closure model for import-pruned production output: direct import usage only, TypeInfo-discovered dependency usage, route/app graph reachability, or a combination?
