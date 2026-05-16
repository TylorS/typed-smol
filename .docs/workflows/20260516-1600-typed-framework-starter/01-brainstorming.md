# Brainstorming - Typed Framework Starter

Status: approved on 2026-05-16 by human.

## Problem Statement

Typed needs a first-class application framework entrypoint. The repo already has low-level pieces: router and HttpApi virtual modules in `@typed/app`, a one-stop Vite preset in `@typed/vite-plugin`, typed config loading, and CLI wrappers. The missing product surface is a fast scaffold path and a clear convention story that makes those pieces feel like one framework.

## Desired Outcomes

- A user can scaffold a Typed pnpm workspace from scratch.
- The starter runs with the full current Typed toolchain instead of a minimal counter-only demo.
- The scaffolded app is minimal but multi-package, with one SSR + hydrated application.
- The scaffolded app demonstrates routes, APIs, env, config, tests, lint, format, and Vite integration.
- The development experience uses one Vite-backed server for client assets, SSR, and HttpApi handlers.
- Server wiring is exposed through `@typed/app` helpers like `TypedHttpServer.layer(...)` rather than app-specific boilerplate.
- The plan preserves current canonical virtual-module specs and only expands them deliberately.

## Constraints and Assumptions

- Strict mode requires explicit approval gates before implementation.
- Existing `.docs/specs/*` and ADRs are durable constraints.
- Existing `.docs/workflows/*` are reference-only for this run.
- The starter should not imply unsupported production features like adapters, auth, databases, or deployment.
- Framework ergonomics can borrow from SvelteKit and Next.js, but implementation should stay native to Typed's router, HttpApi, Effect, and virtual-module model.
- `typed create` is the target scaffold command.
- Environment and config virtual plugins are mandatory scope.
- Code generation remains virtual-module based by design.
- Actual filesystem routing is out of scope because it would undermine composability and introduce inversion of control.
- `vavite` is the preferred substrate for server-side Vite complexity.
- `vavite` integration is expected to live in `@typed/vite-plugin`, with CLI/starter users getting it via the standard preset.
- `TypedHttpServer.layer(...)` should be the clean public server-layer boundary from `@typed/app`.
- Server selection should be declarative: Vite/vavite in dev, Typed's Node server in local runtime mode, static assets plus server handling in production.
- SSL should support both provided cert/key material and generated development certificates.

## Known Unknowns and Risks

- Convention depth: use current `router:./routes` and `api:./endpoints` directly vs introduce an app-directory layer.
- `vavite` integration details: runnable-handler vs runnable-server, default entry path, option surface, and production build behavior.
- `TypedHttpServer.layer(...)` configuration shape for mode selection, static files, host/port, HTTPS, generated certificates, and production behavior.
- Exact Environment virtual module API shape.
- Exact config virtual module API shape.
- Test strategy: balancing starter fixture coverage against slow workspace-wide gates.
- Future create package: whether to add `create-typed` / `pnpm create typed` now or later.

## Candidate Approaches

### Approach A: Template-First Scaffold

Build a maintained starter template around current `@typed/app` and `@typed/vite-plugin` surfaces, add required env/config virtual plugins, expose `TypedHttpServer.layer(...)`, integrate `vavite` into `@typed/vite-plugin` for the HttpApi/SSR dev server path, then add `typed create` to copy it.

Pros:
- Fastest route to a working user experience with the required bells and whistles.
- Uses current canonical specs directly.
- Preserves the intentional virtual-module codegen architecture.
- Leverages `vavite` for server HMR and Vite server integration instead of building that entire lifecycle from scratch.
- Gives app authors one clean server-layer API instead of making generated modules or starters choose concrete HTTP servers ad hoc.
- Starter doubles as integration fixture.

Cons:
- Does not yet feel as convention-rich as SvelteKit/Next.js.
- May expose current lower-level route/API file shape unless the template gives good examples.

### Approach B: Convention Layer First

Design a new app-directory convention in `@typed/app` that generates lower-level router/API modules, then scaffold against that.

Pros:
- Strongest "framework" feel.
- Can hide low-level virtual imports from user code.

Cons:
- Higher risk and broader spec surface.
- More likely to churn existing router/API contracts.
- Rejected for this tranche because actual filesystem routing conflicts with the virtual-module-first direction.

### Approach C: Split Tranche

Ship template-first scaffold now, include env/config virtual plugins, `TypedHttpServer.layer(...)`, and the one-server `vavite` dev path, and explicitly reserve extension points for future virtual-module convention layers.

Pros:
- Useful first deliverable with a clear runway.
- Lets real starter friction guide deeper framework design.

Cons:
- Requires discipline to keep deferred features visible without implementing them prematurely.

## Recommendation

Use Approach C, adjusted by the human's scope decisions. Start with a minimal multi-package starter that exercises existing router and HttpApi virtual modules, adds required Environment and config virtual plugins, exposes `TypedHttpServer.layer(...)`, and proves one SSR + hydrated application plus HttpApi handlers through a single `vavite`-backed dev server created by `typed create`.

Do not pursue filesystem routing. If the current route/API file shapes need ergonomics, solve that through composable virtual modules and explicit imports, not framework-owned route inversion.

## Source Grounding

- consulted_specs:
  - `.docs/specs/typed-config/spec.md`
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
- consulted_adrs:
  - `.docs/adrs/20260515-2018-virtual-module-artifact-store.md`
  - `.docs/adrs/20260221-1745-router-virtual-module-discovery-and-composition-contract.md`
  - `.docs/adrs/20260223-0043-httpapi-virtual-module-filesystem-contract.md`
- consulted_workflows:
  - `.docs/workflows/20260515-2018-typed-framework-evolution/`
- consulted_code:
  - `packages/app/`
  - `packages/cli/`
  - `packages/vite-plugin/`
  - `packages/virtual-modules-vite/`
  - `examples/counter/`
- consulted_dependencies:
  - `cyco130/vavite` README and current v7 migration notes.
- consulted_external:
  - SvelteKit routing, project creation, and project structure docs.
  - Next.js App Router project structure, route handlers, and create-next-app docs.
  - Vite 8 SSR/framework API docs.

## Initial Memory Strategy

- Capture short-term decisions in this workflow's `memories.md` only after Phase 4 execution begins.
- Promote only durable framework-shape decisions to `.docs/_meta/memory/` after implementation evidence exists.
