## Problem Statement

Build the flagship `@typed/app` example application using the RealWorld specification. The app should demonstrate Typed's first-party framework surface and Effect's programming model as the default path for real application code.

## Desired Outcomes

- A RealWorld-compatible example app that demonstrates:
  - `@typed/app` virtual modules for app entrypoints, routing, API contracts, HTML, env, and config.
  - `@typed/router` route modeling and generated matcher usage.
  - `@typed/template` SSR and browser rendering/hydration.
  - `@typed/ui` navigation integration.
  - `@typed/fx` and `RefSubject` for reactive state.
  - Effect `Schema` at every external and internal data boundary.
  - Effect services, layers, and typed errors instead of ad-hoc ambient state.
- A DDD-style structure with clear domain, application, infrastructure, and presentation boundaries.
- A full-stack implementation where `api:` endpoint modules define and serve the RealWorld API contract; this is not a frontend-only hosted API example.
- Initial artifact location is `examples/realworld`; promotion into `typed create` starter templates is out of scope until the example proves out.
- Upstream RealWorld Hurl API tests and shared E2E selector/debug contracts are required acceptance gates.
- A dependency policy that defaults to existing `typed-smol` workspace packages plus `effect`; any additional runtime dependency requires explicit human approval before use.
- Finalization through a pull request.

## Constraints and Assumptions

- Mode: `strict`.
- Finalization strategy: `pr`.
- Existing workflow folders are reference-only.
- The checkout is already dirty; unrelated changes must be preserved.
- The user explicitly requested avoiding non-Effect and non-Typed code wherever possible.
- The user explicitly requested being asked before any dependency that is not already used by the repo.
- The user explicitly selected full-stack scope because this is the point of `@typed/app`.
- The user explicitly selected `examples/realworld` as the first implementation target.
- The user explicitly made upstream Hurl API tests and shared E2E selector/debug contracts required gates.
- The user approved adding `micromark@4.0.2` for article body rendering and XSS gate support.
- The user favors vendored/local CSS and assets over external CSS dependencies or CDNs.
- The user wants seed data so the app is useful immediately.
- The user approved opaque session tokens instead of JWT-compatible tokens.
- The user approved Node built-in `crypto.scrypt` for password hashing, wrapped in a replaceable `Context.Service`.
- The user selected a single-package `examples/realworld` layout with DDD folder boundaries inside the package.
- The user approved specialist subagents where they make sense for this broad workflow.
- The user confirmed everything should be real: SSR must render real SQLite-backed data, browser workflows must use the local API, and the app should not rely on mocks or hosted API fallbacks.
- The user does not want to vendor the upstream RealWorld spec snapshot or wire upstream Hurl/E2E into CI for this first PR, but does want automated local/manual scripts for those gates.
- The user accepts CI for normal type-check/build/test gates.
- The user approved the default SQLite location `examples/realworld/.data/realworld.sqlite`, ignored by git, with reset implemented as delete/recreate, migrate, and seed.
- The user approved exposing generated OpenAPI JSON through the existing HttpApi integrations, without approving an extra docs UI dependency.
- The user approved `@playwright/test` as an example-scoped dev dependency for automated local/manual E2E scripts if needed.
- RealWorld docs are the application contract source:
  - features: auth, users, articles, comments, pagination, favorites, follows.
  - frontend routes: `/`, `/login`, `/register`, `/settings`, `/editor`, `/editor/:slug`, `/article/:slug`, `/profile/:username`, `/profile/:username/favorites`.
  - API base for hosted frontend implementations: `https://api.realworld.show/api`.
- The upstream RealWorld specs are cloned locally at `.temp/references/realworld/specs/` from `realworld-apps/realworld@273d37a959e0583d0c70e26e68f1086294b64489`.

## Typed Module Inventory

| module | likely role |
| ------ | ----------- |
| `@typed/app` | `typed:*`, `router:`, and `api:` virtual module plugin surface; typed config; API handler helper. |
| `@typed/router` | Route schemas, matchers, route guards/layouts/catches, browser/server router layers. |
| `@typed/template` | HTML templates, event handlers, SSR string rendering, DOM rendering, hydration. |
| `@typed/ui` | `Link` and Effect HTTP router SSR bridge. |
| `@typed/fx` | `Fx`, `RefSubject`, `RefArray`, `RefRecord`, `Subject`, and reactive UI state. |
| `@typed/navigation` | Browser and memory navigation layers, route transition hooks, blocking navigation. |
| `@typed/async-data` | Remote-data UI state, refresh/loading/error/optimistic states with Schema codec support. |
| `@typed/guard` | Schema-backed route/request guards and composable validation. |
| `@typed/id` | Branded IDs, UUID/ULID helpers if the example needs local-generated IDs. |
| `@typed/vite-plugin` | Vite integration and virtual module resolver. |
| `@typed/virtual-modules*` | Generated source, TypeScript plugin, Vite resolver, and compiler support for example verification. |
| `@typed/tsconfig` | Example tsconfig presets. |
| `@typed/threads` | Not currently useful for RealWorld; scaffold-only. |

## Effect Module Inventory

| module/facet | likely role |
| ------------ | ----------- |
| `effect/Schema` | All RealWorld domain entities, request payloads, response payloads, URL/query codecs, local storage codecs. |
| `effect/Effect` | Business workflows, API calls, SSR/browser runtime boundaries, typed errors. |
| `effect/Context` | Domain/application/infrastructure service tags. |
| `effect/Layer` | Runtime composition for API client, auth/session, state stores, browser/server layers. |
| `effect/Option` | Optional current user, optional profile fields, optional query filters, maybe-auth flows. |
| `effect/Result`, `effect/Exit`, `effect/Cause` | Remote call conversion, AsyncData failure modeling, test assertions. |
| `effect/Data` | Tagged domain errors where structural equality and pattern matching help. |
| `effect/Match` | Domain UI state and error presentation matching. |
| `effect/Array`, `effect/Record`, `effect/String`, `effect/Boolean`, `effect/Predicate` | Pure domain transformations without ad-hoc utility dependencies. |
| `effect/Redacted` | Candidate for tokens/passwords if compatible with current installed Effect version and UX requirements. |
| `effect/Clock`, `effect/DateTime`, `effect/Duration`, `effect/Schedule` | Cache freshness, optimistic timestamps, retries/backoff, refresh cadence if needed. |
| `effect/Ref` | Internal non-reactive mutable state when `RefSubject` is not appropriate. |
| `effect/Fiber`, `effect/Scope` | Browser runtime lifecycle, background refresh, SSR render scoping. |
| `effect/Stream` | Interop with `Fx` or streaming render/server APIs when useful. |
| `effect/Config` | Runtime configuration for API base URL and server options via `typed:config` / `typed:env`. |
| `effect/unstable/http/HttpClient` and related facets | RealWorld HTTP API client implementation without adding a separate fetch/client library. |
| `effect/unstable/httpapi/*` | Generated `api:` module integration, HttpApi client/server contracts, and OpenAPI JSON exposure. |
| `effect/unstable/sql/SqlClient` | Backend SQLite persistence boundary through Effect SQL. |
| `effect/unstable/sql/SqlSchema` | Schema-driven SQL result decoding and repository query helpers. |
| `effect/unstable/sql/Migrator` | Local schema migrations for the RealWorld SQLite database. |
| `effect/unstable/sql/SqlError` | Typed persistence failures surfaced through repositories and endpoint errors. |
| `effect/unstable/persistence/KeyValueStore` | Browser token/session storage using existing pattern from TodoMVC. |
| `effect/testing/FastCheck`, `effect/testing/TestSchema`, `effect/testing/TestClock` | Property/schema tests and deterministic state/refresh tests. |

## Dependency Guardrail

The default dependency set is:

- first-party workspace packages already in `pnpm-workspace.yaml`;
- `effect` and `@effect/platform-node`, already cataloged;
- existing toolchain dependencies already used by the repo.

Additional dependencies require explicit human approval before use. The only approved additions so far are:

- `@effect/sql-sqlite-node@4.0.0-beta.66`, the Effect 4-compatible SQLite adapter package; it depends on `better-sqlite3`.
- `micromark@4.0.2`, approved markdown renderer; it escapes raw HTML by default and strips dangerous `javascript:` link/image protocols in local verification.
- `@playwright/test`, approved as an example-scoped dev dependency for automated local/manual E2E scripts if current workspace tooling is insufficient.

Unapproved dependency categories include, but are not limited to:

- markdown renderer/sanitizer packages for RealWorld article bodies;
- Bootstrap/Conduit CSS packages or vendored external assets;
- third-party form, validation, query-cache, state, router, HTTP, or testing libraries.

The user selected SQLite via `effect/unstable/sql` as the backend persistence direction and explicitly approved `@effect/sql-sqlite-node@4.0.0-beta.66` for this workflow.

## Known Unknowns and Risks

- Persistence shape: SQLite through `@effect/sql-sqlite-node@4.0.0-beta.66` is approved, but the migration/seed/reset layout still needs requirements.
- Markdown rendering: `micromark@4.0.2` is approved; renderer placement, caching, and server/client safety still need requirements.
- Raw HTML rendering inside article Markdown is not required by the cloned XSS gate; escaping raw HTML is preferable to sanitizing and preserving it for this flagship example.
- Styling: RealWorld expects a consistent Conduit-style UI; use local vendored CSS/assets in `examples/realworld` rather than Bootstrap/CDN packages.
- `@typed/app` generated server/browser modules are currently composable helpers; the example may need app-owned runtime wiring.
- Effect unstable HTTP and HttpApi APIs should be isolated behind local services/adapters.
- Future promotion path from `examples/realworld` into `typed create` should be revisited only after implementation evidence exists.
- Keep the first implementation as one package: `src/domain`, `src/application`, `src/infrastructure`, `src/presentation`, `src/api`, and `src/routes` are folder boundaries, not workspace package boundaries.
- Hurl and Playwright may not be installed locally; the plan must either use available toolchain paths or document install/runtime prerequisites without weakening the local/manual gates.
- Hurl and Playwright should be script-automated local/manual acceptance gates for this tranche, not CI gates.
- SQLite seed/reset behavior must be deterministic so app demos and required contract tests can run from a known state.
- Auth should expose RealWorld-compatible token strings and `Authorization: Token ...` behavior, but the local implementation can use opaque signed/session tokens stored in SQLite rather than JWT.
- Password hashing must not be inline application code; expose it through an Effect `Context.Service` so the example can swap in Argon2, bcrypt, or another implementation later without changing domain/application logic.
- Specialist subagents are authorized for independent research, requirements, and testing slices; keep code edits local until an approved plan exists.
- The local app should probably use same-origin `/api` browser calls, but copied upstream E2E specs contain a few hosted `https://api.realworld.show/api` intercept assumptions that may require a documented runner adaptation.
- SSR should fetch real local application state through server-side services/repositories; app-shell-only SSR is not acceptable for this flagship example.
- Delete endpoints should return strict RealWorld `204` responses, while the frontend can still tolerate any successful mocked response in resilience tests.
- Local Hurl is not currently available on `PATH`; Hurl remains a required gate even if installation/setup has to be documented separately.
- Shared E2E specs import `@playwright/test`; repo wiring must confirm whether existing lockfile/tooling is enough or whether an explicit dev dependency needs approval.

## Subagent Synthesis

- Research Scout confirmed the upstream API surface: auth/user, profiles/follow, articles/feed/list/detail/create/update/delete, comments, favorites, and tags, with strict RealWorld response envelopes and error shapes.
- Research Scout confirmed Hurl-observed behavior that must be modeled in domain/application errors: `401` missing/invalid auth, `403` ownership errors, `404` missing resources, `409` duplicates, and `422` field validation.
- Research Scout confirmed UI compatibility is selector-driven, not just visual: required routes, Conduit class names, form names/placeholders, visible labels, `window.__conduit_debug__`, `localStorage.jwtToken`, and `default-avatar.svg`.
- Requirements Analyst mapped the first package shape to `examples/realworld` with `src/domain`, `src/application`, `src/infrastructure`, `src/presentation`, `src/api`, and `src/routes`.
- Requirements Analyst confirmed required Typed modules: `@typed/app`, `@typed/router`, `@typed/template`, `@typed/ui`, `@typed/fx`, and `@typed/vite-plugin`; expected helpers include `@typed/async-data`, `@typed/guard`, and `@typed/navigation`.
- Requirements Analyst confirmed required Effect facets: `Effect`, `Schema`, `Context`, `Layer`, `Data`, `Option`, `Match`, `Clock`/`DateTime`, `Config`, `Ref`, `Scope`, `unstable/httpapi`, `unstable/http`, `unstable/sql`, `unstable/sql/SqlSchema`, and `unstable/sql/Migrator`.
- Test Strategist recommended the validation ladder: domain/schema/property tests, SQLite repository integration tests, generated `api:` contract tests, SSR/CSR smoke, upstream Hurl, upstream Playwright E2E, then root build/test gates before PR.
- Test Strategist confirmed seed/reset determinism is a first-order requirement because Hurl creates unique users while E2E expects stable global feed, tags, avatars, favorites, and pagination behavior.

## Candidate Approaches

### Approach A - Full-stack SQLite backend with Effect SQL

- Uses `effect/unstable/sql` as the persistence API and SQLite as the local database.
- Implements RealWorld API endpoints through `api:` modules and DDD repositories backed by SQLite.
- Uses the approved SQLite adapter package: `@effect/sql-sqlite-node@4.0.0-beta.66`.
- Keeps setup simple while proving the full server-side `@typed/app` and Effect persistence path.

### Approach B - Full-stack demo backend with in-memory state

- Uses only existing repo dependencies.
- Implements RealWorld API endpoints through `api:` modules and a DDD application layer backed by Effect `Ref`/`RefSubject` state.
- Suitable for local dev, SSR, CSR, and Hurl/E2E contract testing within one process.
- Not durable across restarts.

### Approach C - Full-stack demo backend with file-backed local persistence

- Still avoids database dependencies if implemented with `@effect/platform-node` filesystem APIs and Effect Schema codecs.
- Keeps demo state across process restarts.
- Adds more infrastructure surface and failure modes than a flagship example may need.

### Approach D - Full-stack backend with another approved database dependency

- Most production-like.
- Requires explicit human approval for any new database/runtime dependency.
- Risks turning the flagship example into a database integration project instead of an `@typed/app` showcase.

## Recommendation

Start with Approach A: SQLite through Effect SQL. It keeps setup local and simple while proving full-stack `@typed/app` with real persistence.

## Source Grounding

- consulted_specs:
  - `.docs/specs/typed-framework-starter/spec.md`
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
- consulted_adrs:
  - none found in current pass
- consulted_workflows:
  - `.docs/workflows/20260515-2018-typed-framework-evolution/`
  - `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/`
  - `.docs/workflows/20260516-1600-typed-framework-starter/`
- consulted_external_sources:
  - `https://docs.realworld.show/`
  - `https://docs.realworld.show/implementation-creation/features/`
  - `https://docs.realworld.show/specifications/frontend/routing/`
  - `https://docs.realworld.show/specifications/frontend/api/`
  - `https://docs.realworld.show/specifications/backend/endpoints/`
  - `.temp/references/realworld/specs/api/openapi.yml`
  - `.temp/references/realworld/specs/api/hurl/*.hurl`
  - `.temp/references/realworld/specs/e2e/*.spec.ts`
  - `.temp/references/realworld/specs/e2e/SELECTORS.md`

## Initial Memory Strategy

- Capture short-term decisions in this workflow.
- Promote only durable repo lessons, such as final module-selection policy or dependency guardrails, after implementation evidence exists.
