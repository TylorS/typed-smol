# Intent

Re-shape the current massive `codex/typed-beta` PR into a mergeable, evidence-backed release slice centered on virtual modules and the compiler/runtime surfaces they enable.

The desired end state is not a pile of disconnected fixes. It is one coherent Typed framework path where:

- virtual modules work consistently in dev mode, build, preview, `vmc`, TypeScript language service, VS Code, and RealWorld;
- VS Code and the TypeScript plugin are stable first-class surfaces, sharing cached generated files efficiently instead of rebuilding or re-materializing virtual modules through parallel paths;
- Storybook is a stable and reliable framework surface that exercises the same generated app/runtime/client paths as normal applications instead of relying on special fixture-only behavior;
- the compiler discovers trustworthy facts about modules, templates, route participation, HMR boundaries, and runtime instrumentation;
- stateful HMR is enabled only where the compiler can prove stable identity and preserve `RefSubject` state correctly;
- templates compile through the shared compiler path into optimized server HTML and DOM runtime outputs;
- DevTools panels are inspectable end to end from live app facts, not only fixture-backed UI;
- `examples/realworld` remains the flagship proof surface across dev, build, preview, browser acceptance, HMR, Storybook, and generated runtime paths;
- generated HttpApi client output exposes the raw Effect `HttpApiClient`-derived surface, preserving generic function parameters and `HttpClient.With<E, R>` channels without `TypedClient` wrappers.
- generated virtual-module output remains type-safe end to end, with no public `any`/`unknown` erasure or wrapper casts that hide broken inference;
- every first-party plugin supports production builds that emit only the imports consumed by user code and the transitive dependencies required by those imports.

The work should reduce PR scope by drawing hard boundaries, deleting misleading abstractions, replacing fake or partial proof with executable acceptance gates, and sequencing the remaining changes into reviewable tasks.

The simplifying principle is that framework-level code paths should converge rather than multiply. Shared caches, shared generated artifacts, shared TypeInfo sessions where appropriate, shared host abstractions, and shared configuration loading are preferred over per-surface special cases. Typed config, Vite config, `vmc`, and TypeScript integration should derive from one coherent configuration model wherever possible. Any retained duplication must have a specific ownership reason and a test proving the alternate path is necessary.

The production-build principle is import precision: generated modules should be shaped by actual user imports and their dependency closure, not by broad all-exports emission. This is both an optimization requirement and a type-safety requirement because unused generated surfaces should not force stale, unsafe, or unrelated code into the build.

This workflow treats prior workflow folders as reference material only. It does not continue or mutate the existing `.docs/workflows/20260524-1047-cohesion-remediation-plan/` unless the human later explicitly asks to reuse it.
