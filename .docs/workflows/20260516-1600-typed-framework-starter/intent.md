# Intent - Typed Framework Starter

Status: approved on 2026-05-16 by human.

## Problem

Typed has strong framework primitives but still requires users to assemble too much by hand. `@typed/app` provides router and HttpApi virtual module plugins, `@typed/vite-plugin` registers app plugins for Vite, and `@typed/cli` wraps core Vite/Vitest/lint/format commands. The next step is to make the experience feel like a coherent application framework and starter workflow rather than a collection of packages.

## Desired Outcome

Design and implement a strict, PR-backed framework expansion that lets a user scaffold a new Typed pnpm workspace quickly with the expected framework defaults already wired.

The intended end state is:

- `@typed/app` owns the first-party framework conventions for routes, API endpoints, config, and future app-level virtual modules.
- `@typed/cli` exposes `typed create` as the starter/scaffold flow, comparable in ergonomics to `create-next-app` or SvelteKit's `sv create`, but aligned with Typed's virtual-module architecture.
- The starter workspace is minimal but still multi-package, with Typed's router and HttpApi plugin defaults, Environment and config virtual plugins, Vite integration, TypeScript setup, test/lint/format scripts, and a single SSR + hydrated application.
- Development uses one Vite-backed server for client assets, SSR, and HttpApi handlers so HMR and module invalidation work across client and server code without requiring multiple local servers.
- `@typed/vite-plugin` integrates `vavite` so Typed owns the framework wiring instead of forcing every starter app to hand-author the server-side Vite plumbing.
- `@typed/app` exposes clean server helpers, centered on `TypedHttpServer.layer(...)`, so app code can wire HttpApi/SSR layers like `NodeHttpServer.layer(createServer, ...)` while Typed selects the right backing server for dev, local runtime, and production static assets.
- The generated app is useful both as a smoke-test fixture and as the recommended starting point for new users.

## Product Thesis

Typed should feel like "SvelteKit for Typed": filesystem conventions and generated type surfaces reduce setup friction, while the framework remains built on explicit virtual-module plugins and Effect-compatible runtime contracts.

## Evidence

- Current `@typed/app` README documents `router:./path` and `api:./path` virtual imports plus companion-file conventions.
- Current `@typed/vite-plugin` always registers router and HttpApi app virtual module plugins through `createTypedViteResolver`.
- Current `@typed/cli` has `serve`, `build`, `preview`, `run`, `test`, `lint`, and `format`, but no scaffold command.
- Current `examples/counter` is a simple Vite app and does not exercise router or HttpApi framework conventions.
- Current CLI `serve` SSR-loads a resolved server entry, while `build` emits separate client and server outputs when `index.html` exists.
- Current `@typed/template` documents and implements SSR and hydration primitives through `HtmlRenderTemplate`, `DomRenderTemplate`, and hydration context support.
- Current `@typed/ui` exposes `ssrForHttp` and `handleHttpServerError`, and tests route server-side rendered templates through Effect `HttpRouter`.
- Current HttpApi virtual module generation emits `Api`, `Client`, `ApiLive`, and `serve` helpers, including `HttpApiBuilder.layer(...)` and generated server layer wiring.
- Current generated `api:` server code directly creates `NodeHttpServer.layer(http.createServer, { host, port })`, which is useful proof but not the desired final abstraction for framework apps.
- Current Vite 8 framework docs support middleware-mode/custom SSR servers and server environment module runners that transform server entries without bundling during dev.
- `cyco130/vavite` is a Vite plugin for developing and building server-side applications with Vite as the transpiler/bundler.
- Current `vavite` supports handler entries mounted into Vite's dev server, SSR ordering after Vite's asset pipeline, access to the Vite dev server through `vavite:vite-dev-server`, and server HMR cleanup through `import.meta.hot.dispose`.
- Current `vavite` v7 documents Node 22+ and Vite v7+ as the baseline.
- SvelteKit's current docs center a filesystem router under `src/routes`, `+page`, `+layout`, and `+server` route files.
- Next.js current App Router docs center filesystem conventions under `app`, route handlers, project scaffolding, and tool defaults.

## Open Questions

- Should the first route convention mimic existing `router:./routes` files directly, or introduce higher-level app-directory conventions that generate those lower-level modules?
- Should `typed create` remain only inside `@typed/cli` for this tranche, or should a future `create-typed` package delegate to the same implementation for `pnpm create typed`?
- What exact Environment virtual module API should be generated first: static private/public modules, dynamic runtime modules, schema-driven config, or a narrower subset?
- What exact config virtual module should be exposed first: raw `typed.config.ts`, normalized resolved config, or route/API/env-specific slices?
- What is the exact `@typed/vite-plugin` option surface for `vavite`: always-on for framework apps, enabled by `typed.config.ts`, or explicit opt-in?
- Should Typed use a `vavite` runnable-handler entry by default and reserve runnable-server/proxy mode for advanced users?
- What should `TypedHttpServer.layer(...)` accept as its declarative static-file and SSL configuration shape?
- What should "local mode" mean precisely in the config model: production-like local Node server, preview server, or a separate non-Vite dev mode?

## Decisions

- Strict mode and PR finalization are selected.
- This workflow is new; prior framework-evolution docs are reference-only unless explicitly approved for reuse.
- Existing router, HttpApi, typed config, and virtual artifact store specs are treated as canonical constraints.
- The starter must be minimal, but still multi-package.
- The starter must include a single SSR + hydrated application.
- The scaffold command target is `typed create`.
- Environment and config virtual plugins are required scope for this framework tranche, not optional follow-up candidates.
- The dev experience must use one Vite-backed server for client, SSR, and HttpApi handlers.
- The Vite-backed server should use `vavite` to reduce custom framework-server complexity.
- `vavite` integration most likely belongs inside `@typed/vite-plugin`, with `@typed/cli` and the starter consuming it through the normal Typed Vite preset.
- `@typed/app` should expose `TypedHttpServer.layer(...)` as the clean public server-layer API.
- `TypedHttpServer.layer(...)` should automatically use Vite's server in dev mode, Typed's own Node server in local runtime mode, and a declaratively configured static file server for production usage.
- `TypedHttpServer.layer(...)` should support provided SSL certificates and generated development certificates.
- Typed should not introduce actual filesystem routing. Code generation remains intentionally virtual-module based so framework pieces stay composable and do not require inversion of control.
- No implementation starts until Phase 1 intent/scope are explicitly approved, committed, and Phase 2 requirements are drafted.
