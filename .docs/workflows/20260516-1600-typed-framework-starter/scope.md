# Scope - Typed Framework Starter

Status: approved on 2026-05-16 by human.

## In Scope

### Framework Shape

- Define the first user-facing framework experience for a new Typed app.
- Decide how much SvelteKit/Next.js-style filesystem convention belongs in `@typed/app` versus the generated starter.
- Preserve the existing router and HttpApi virtual module contracts unless requirements prove a new convention layer is needed.
- Include first-party Environment and config virtual plugins as framework capabilities in `@typed/app`.
- Support one SSR + hydrated application path in the starter, grounded in existing `@typed/template` and CLI/Vite behavior.
- Keep all framework code generation on virtual-module paths; do not add actual filesystem routing or a framework-controlled route tree that requires inversion of control.

### Vite-Backed Development Server

- Back the HttpApi server path with Vite during development.
- Use one local dev server for client asset serving, SSR rendering, and HttpApi handlers.
- Use Vite transforms, module invalidation, and HMR for both client and server-side app code where Vite supports it.
- Avoid requiring users to run a separate API server beside the Vite dev server.
- Use `vavite` to handle the server-side Vite lifecycle where it fits Typed's runtime model.
- Integrate `vavite` through `@typed/vite-plugin` unless Phase 2 research finds a concrete incompatibility.
- Prefer `vavite` runnable-handler mode for the starter so the HttpApi/SSR handler mounts into the Vite dev server instead of starting a second required local server.

### Typed HTTP Server Helpers

- Add clean public server helpers in `@typed/app`, centered on `TypedHttpServer.layer(...)`.
- Make the API feel analogous to `NodeHttpServer.layer(createServer, ...)`, but framework-aware.
- In dev mode, automatically back the HttpApi/SSR server with the Vite/vavite dev server.
- In local runtime mode, use Typed's own Node HTTP server layer without requiring Vite.
- In production mode, support a declaratively configured static file server for built client assets plus HttpApi/SSR handling.
- Support both provided SSL certificate/key material and generated development certificates.
- Keep generated `api:` modules consuming this helper instead of directly choosing `NodeHttpServer.layer(http.createServer, ...)` in final framework paths.

### CLI and Scaffolding

- Add a first-party way to create a new Typed pnpm workspace from a starter template.
- Add `typed create` as the public scaffold command for this tranche.
- Keep a future `pnpm create typed` / `create-typed` package as a compatibility question, not a required first deliverable.
- Include package scripts and defaults for dev/build/preview/test/lint/format.
- Keep generated files inspectable and conventional for TypeScript users.

### Starter Application

- Include a minimal but multi-package pnpm workspace.
- Include a single working SSR + hydrated application that exercises:
  - `typed.config.ts`
  - `@typed/vite-plugin`
  - router virtual modules
  - HttpApi virtual modules
  - Environment virtual modules
  - config virtual modules
  - `@typed/template` SSR and hydration
  - one Vite-backed dev server for SSR + HttpApi + client HMR
  - `TypedHttpServer.layer(...)` server wiring
  - declarative static asset serving
  - provided or generated SSL certificates
  - TypeScript configuration
  - tests and build scripts
- Use the starter as a regression fixture where practical.

### Documentation and Workflow Artifacts

- Maintain strict stage artifacts in `.docs/workflows/20260516-1600-typed-framework-starter/`.
- Link requirements to plan tasks before implementation.
- Update durable specs only when the accepted design changes canonical behavior.

## Out of Scope Until Approved Later

- Publishing packages to npm.
- Adapter ecosystem design.
- Authentication/database/deployment features.
- A full UI component system.
- Replacing Vite.
- Actual filesystem routing.
- Running a separate required API dev server alongside Vite.
- Multiple app starters or template variants.
- Full `pnpm create typed` / `create-typed` publication flow unless Phase 2 requirements explicitly include it.

## Candidate Workstreams

1. Framework convention design over current router and HttpApi plugins.
2. `@typed/vite-plugin` + `vavite` integration for the Vite-backed HttpApi + SSR dev server.
3. `@typed/app` `TypedHttpServer.layer(...)` helper design.
4. Environment virtual plugin design and implementation.
5. Config virtual plugin design and implementation.
6. `typed create` scaffold command design.
7. Starter template content and workspace layout.
8. Starter-as-fixture test strategy.
9. Docs/spec updates and PR finalization.

## Initial Recommendation

Start with a framework starter that uses the existing `@typed/app` router and HttpApi virtual modules directly, adds required Environment and config virtual plugins, provides one `vavite`-backed dev server for client + SSR + HttpApi development through `@typed/vite-plugin`, exposes `TypedHttpServer.layer(...)` from `@typed/app` for clean dev/local/production server wiring, and exposes `typed create` to copy a maintained multi-package template with package-name substitutions.

Do not add actual filesystem routing. Keep framework discovery and code generation virtual-module based so features remain composable and do not require framework inversion of control.

## Subagent Routing

- Task shape: multi-stream framework planning with requirements/spec extraction and later execution.
- Repo policy says this shape normally routes to specialists for requirements, planning, test strategy, and release readiness.
- Current Phase 1 direct work is limited to artifact initialization and synthesis from known files; later broad research/planning should use specialist routing if explicitly authorized in this run.

## Approval Rule

These documents are drafts until explicitly approved by the human. After approval, commit the Phase 1 artifacts and continue to Phase 2 requirements.
