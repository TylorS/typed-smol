# Intent - RealWorld Flagship Example

Status: approved on 2026-05-16 by human.

## Problem

`@typed/app` now has a broader virtual module surface, but the examples do not yet prove the full-stack framework story through a realistic application. The RealWorld spec is a good flagship target because it forces routing, auth, persistence, API contracts, SSR, CSR, validation, forms, optimistic state, and user-facing error handling into one coherent app.

## Desired Outcome

Build `examples/realworld` as the flagship `@typed/app` example: a full-stack Conduit/RealWorld application implemented with Typed and Effect as the default tools.

The intended end state is:

- `@typed/app` virtual modules drive app entrypoints, API endpoint discovery, route discovery, server/browser wiring, env/config, and HTML rendering.
- The backend serves the RealWorld API locally through `api:` endpoint modules; it does not delegate to the hosted RealWorld API.
- SQLite persistence is implemented through `effect/unstable/sql` and the approved `@effect/sql-sqlite-node@4.0.0-beta.66` adapter.
- Every domain entity, request payload, response payload, URL/query shape, local storage shape, and error envelope is modeled with Effect Schema.
- Application behavior is expressed through Effect services, layers, typed errors, and small pure domain functions.
- Client state uses `RefSubject` and Typed reactive primitives where state needs to drive UI updates.
- SSR renders real SQLite-backed data for meaningful application pages, and CSR/hydration preserves interactive workflows against the local API.
- The UI satisfies the upstream RealWorld selector/debug contract while keeping styling and assets local to the example.
- The app includes useful deterministic seed data and a deterministic reset path for tests and demos.
- Upstream Hurl API tests and shared E2E specs are treated as acceptance gates.

## Product Thesis

The example should show Typed as an application framework, not just a rendering or routing library: virtual modules provide the framework convention, while Effect provides the application model for validation, services, state, persistence, and error handling.

## Evidence

- Current `@typed/app` supports router, HttpApi/API, env, config, server, browser, and HTML virtual module plugins.
- Current `@typed/app` generated API helpers are designed around Effect HttpApi server/client layers and endpoint modules.
- Current `examples/todomvc` already demonstrates a DDD-ish structure and `RefSubject` state, but it is not full-stack and does not exercise the RealWorld contract.
- Current `examples/counter` demonstrates minimal SSR/browser rendering but not router/API/persistence composition.
- The upstream RealWorld docs define a known production-shaped app surface: auth, profiles, articles, comments, favorites, follows, tags, settings, editor, pagination, and profile feeds.
- The cloned RealWorld specs provide exact API, Hurl, selector, and Playwright contracts from `realworld-apps/realworld@273d37a959e0583d0c70e26e68f1086294b64489`.
- The user explicitly selected strict mode, PR finalization, full-stack scope, SQLite through Effect SQL, `examples/realworld` as first target, required Hurl/E2E gates, vendored assets, seed data, opaque tokens, replaceable password hashing, and a single-package DDD layout.

## Open Questions

- None for Phase 1.

## Decisions

- Strict mode and PR finalization are selected.
- This workflow is new; prior workflow folders are reference-only.
- The first implementation target is `examples/realworld`.
- The app must be full-stack.
- API behavior must be served locally through Typed/Effect modules.
- SQLite through `effect/unstable/sql` is the backend persistence direction.
- `@effect/sql-sqlite-node@4.0.0-beta.66` is approved.
- `micromark@4.0.2` is approved for markdown rendering.
- Styling and assets should be vendored/local.
- Seed data is required.
- Opaque session tokens are acceptable, stored under RealWorld-compatible token surfaces.
- Password hashing should use Node built-in `crypto.scrypt` behind a replaceable Effect `Context.Service`.
- The first package should be a single package with DDD folder boundaries.
- Specialist subagents are allowed where they make sense.
- SSR, API, persistence, seed data, and browser workflows should all use real local application state; no mock backend, hosted API fallback, or shell-only SSR path is acceptable for the flagship.
- The upstream RealWorld spec snapshot should not be vendored into the repo for this first PR, and Hurl/E2E do not need CI wiring right now. Keep them automated through local/manual scripts with documented setup.
- CI for this first PR can still run normal type-check, build, and package test gates.
- The default SQLite database should live under ignored example-local data, `examples/realworld/.data/realworld.sqlite`.
- The reset path should delete/recreate the SQLite database, run migrations, and load deterministic seed data.
- The local API should expose generated OpenAPI JSON using the existing HttpApi integrations; no Swagger/Scalar/docs UI dependency is approved.
- `@playwright/test` is approved as an example-scoped dev dependency if needed for automated local/manual E2E scripts.
- No implementation starts until Phase 1 intent/scope are explicitly approved, committed, and Phase 2 requirements are drafted.
