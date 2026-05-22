# Scope - RealWorld Flagship Example

Status: approved on 2026-05-16 by human.

## In Scope

### Application Shape

- Build `examples/realworld` as a single package in this repository.
- Use internal DDD boundaries: `src/domain`, `src/application`, `src/infrastructure`, `src/presentation`, `src/api`, and `src/routes`.
- Keep the example inspectable as application code, not hidden framework magic.
- Use Typed and Effect first; avoid non-Typed and non-Effect libraries unless explicitly approved.

### RealWorld Compatibility

- Implement the RealWorld API locally.
- Render pages from real local SQLite-backed application data during SSR.
- Use the local API for browser interactions after hydration.
- Preserve upstream response envelopes and status codes for users, profiles, articles, comments, favorites, follows, and tags.
- Preserve upstream frontend routes and selector/debug contracts.
- Store the browser token under the RealWorld-compatible `jwtToken` key even if the token itself is opaque.
- Render `default-avatar.svg` for missing avatars and never render literal `null` user/profile fields.
- Include deterministic seed data that supports global feed, tags, avatars, profiles, favorites, and pagination tests.

### Typed Framework Surface

- Use `@typed/app` virtual modules for app entrypoints and generated integration surfaces.
- Use `api:` endpoint modules for local API endpoints.
- Use `router:` modules for frontend route discovery/matching.
- Use `typed:server`, `typed:browser`, `typed:html`, `typed:env`, and `typed:config` where applicable.
- Use `@typed/router`, `@typed/template`, `@typed/ui`, `@typed/fx`, `@typed/vite-plugin`, and likely `@typed/async-data`, `@typed/guard`, and `@typed/navigation`.
- Use `RefSubject` for client/application state where reactivity is required.
- Expose generated OpenAPI JSON through the existing HttpApi integration.

### Effect Application Surface

- Model all data and boundaries with Effect Schema.
- Express workflows through Effect services, layers, typed errors, and explicit dependency injection.
- Use `Context.Service` boundaries for replaceable infrastructure, including password hashing.
- Use `effect/unstable/sql` with SQLite for persistence.
- Use `SqlSchema`/migrations where they fit the current Effect API.
- Use Effect HTTP/HttpApi facets for local API client/server integration where compatible with `@typed/app`.
- Isolate unstable Effect APIs behind local services/adapters.

### Local Data

- Store the default SQLite database at `examples/realworld/.data/realworld.sqlite`.
- Keep `examples/realworld/.data/` ignored by git.
- Reset local data by deleting/recreating the SQLite database, running migrations, and applying deterministic seed data.

### Validation

- Add focused domain/schema/property tests where possible.
- Add SQLite repository/integration tests for migrations, seed/reset, query behavior, and transactions.
- Add API contract tests for generated endpoint modules and RealWorld error mapping.
- Add SSR/CSR smoke coverage for representative pages and hydration/debug state.
- Provide automated local/manual scripts for upstream Hurl API specs; do not wire them into CI for the first PR.
- Provide automated local/manual scripts for upstream shared E2E specs or an approved local adaptation; do not wire them into CI for the first PR.
- Run relevant package and root type-check/build/test gates before PR finalization, and allow those normal static/package gates in CI.

## Out of Scope Until Approved Later

- Promoting this into `typed create` or starter templates.
- Adding a separate workspace package split for domain/application/infrastructure.
- Delegating backend behavior to `https://api.realworld.show/api`.
- Vendoring the upstream RealWorld spec snapshot into the repo for this first PR.
- Wiring upstream Hurl/E2E suites into CI for this first PR.
- Committing local SQLite data files.
- Adding Swagger, Scalar, or another OpenAPI documentation UI dependency.
- Adding unapproved runtime dependencies.
- Using `@playwright/test` as a runtime dependency.
- Supporting a production deployment story beyond local/example runtime needs.
- Adding OAuth, JWT libraries, Argon2/bcrypt, Redis, Postgres, or external asset/CDN dependencies.
- Expanding the scope to admin tooling, moderation, notifications, or features outside RealWorld.
- Replacing existing Typed virtual module conventions with filesystem routing.

## Candidate Workstreams

1. Requirements and acceptance criteria from upstream RealWorld API, Hurl, E2E, and selector contracts.
2. Domain model and Schema design for users, profiles, articles, comments, tags, auth/session, payloads, and errors.
3. SQLite migration, repository, seed/reset, and password/session infrastructure.
4. `api:` endpoint modules and RealWorld error/status mapping.
5. Frontend routes, SSR data loading, client hydration, auth state, and RefSubject state stores.
6. Conduit-compatible UI, local CSS/assets, markdown rendering, and XSS-safe article content.
7. Test harness wiring for package tests, Hurl, Playwright, smoke tests, and PR gates.
8. Documentation and final PR preparation.

## Initial Recommendation

Implement the flagship as a real-data SSR application backed by SQLite and local API services. Use same-origin `/api` calls in the browser by default, keep API base configurable for tests, and preserve the upstream selector/debug contract exactly. Treat every visible workflow as real local state: no shell-only SSR, no mock API, and no hosted RealWorld API fallback.

Keep the first implementation single-package and DDD-organized. Vendor CSS/assets locally. Treat Hurl and Playwright as hard gates even if local prerequisites must be documented or installed during execution.

## Subagent Routing

- Task shape: multi-stream planning and later execution with independent research, requirements, testing, and implementation concerns.
- The human authorized specialist subagents where useful.
- Current Phase 1 used read-only specialists for RealWorld spec synthesis, requirements mapping, and validation strategy.
- Future phases should use specialists for independent research/test-plan/code-review slices when they do not block the immediate local step.

## Approval Rule

These documents are drafts until explicitly approved by the human. After approval, commit the Phase 1 artifacts and continue to Phase 2 requirements.
