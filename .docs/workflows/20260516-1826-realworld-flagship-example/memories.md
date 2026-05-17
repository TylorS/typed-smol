# RealWorld Workflow Memories

## Task 0 - ApiHandler Canonicalization

- `@typed/app` now uses route/method `ApiHandler(route, method, schemas?)(handler)` as the canonical public endpoint helper.
- The historical helper alias was removed from the package-root export surface, tests, docs, starter template, virtual-module sample docs, and HttpApi virtual-module specs.
- The old config-object `ApiHandler({ route, method, ... })(handler)` shape was removed from public tests to avoid two public helpers with the same name.
- Verification required building local workspace dependencies in this worktree before app tests could import `@typed/router` and `@typed/virtual-modules`.
- Dependency bootstrap used `pnpm install --no-frozen-lockfile --lockfile=false` so the unrelated dirty `pnpm-lock.yaml` was not modified by this task.

## Task 1 - Package Skeleton

- `examples/realworld` starts as the single package named `typed-realworld` with only approved runtime/dev dependencies.
- The build script intentionally compiles only non-test `src/**/*.ts`; Vitest owns `src/tests/**`.
- Database, Hurl, and Playwright scripts are present but fail loudly until their owning tasks wire real implementations.
- `typed.config.ts` uses `defineConfig` and declares the intended `api:` and `router:` prefixes; the first browser build avoids virtual imports so package wiring can be verified before route/API files exist.
- Local build verification in this worktree required building `@typed/virtual-modules-vite` and `@typed/vite-plugin` before Vite could load the workspace plugin package.

## Task 2 - Schema Baseline

- Response envelope schemas live in `src/domain/RealWorldApi.ts` and compose schemas from `Ids.ts`, `User.ts`, `Article.ts`, `Pagination.ts`, and `Errors.ts`.
- Article list responses intentionally use `ArticlePreview`, whose struct strips `body` on decode/encode while single article responses use full `Article`.
- Effect Schema `Struct` strips extra keys by default; the schema test locks this behavior for body-free article previews.
- Timestamps are modeled as branded ISO UTC strings for API compatibility instead of decoded DateTime values.

## Task 3 - Domain Invariants

- Slug helpers are pure and deterministic: `toSlugBase` normalizes titles and `uniqueSlug` appends numeric suffixes starting at `-2`.
- Tag updates distinguish `undefined` as preserve-existing and `[]` as remove-all, matching the RealWorld article update contract.
- `parseAuthorizationHeader` returns Effect `Option` and only accepts exact `Token <opaque-token>` headers.
- Markdown rendering goes through `src/domain/Markdown.ts`; raw dangerous nodes, event-handler attributes, and `javascript:` URLs are stripped or escaped at the boundary.

## Task 4 - SQLite Storage

- SQLite wiring uses `SqliteClient.layer({ filename })` and accesses SQL through `yield* SqlClient.SqlClient`.
- `DatabaseManager` is a class-based `Context.Service`; `resetDatabase`, `migrateDatabase`, and `seedConfiguredDatabase` provide that service from `DatabaseManager.Live`, which depends on `RealWorldConfig`.
- The compiled db CLI uses package `process.cwd()` as the example root so `db:reset` writes `examples/realworld/.data/realworld.sqlite`, not under `dist`.
- The example avoids adding `@types/node`; `src/types/node-lite.d.ts` declares only the Node globals/modules used by this package.
- Local setup required rebuilding `better-sqlite3` with `node-gyp rebuild --release` after the lockfile-only install left the native binding absent.

## Task 5 - User Persistence Services

- `PasswordHasher` is a class-based `Context.Service` backed by Node `crypto.scrypt`; stored password hashes and salts are modeled with Effect Schema.
- `SessionTokens` creates opaque base64url tokens, persists them in SQLite, and remains replaceable through its service layer.
- `UserRepository` composes `PasswordHasher`, `SessionTokens`, `RealWorldConfig`, and `effect/unstable/sql` through `Layer.effect`; it exposes create, lookup, token lookup, update, credential verification, and delegated session creation.
- Repository inputs are decoded with Effect Schema at the boundary, and database rows are mapped back through the domain `User` schema using typed `Schema.SchemaError` failures rather than defects.
- Infrastructure tests that mutate SQLite should use isolated database paths when they can run concurrently under Vitest.
- Infrastructure service and repository method signatures must never use `unknown` error channels; use explicit unions such as `RepositoryPersistenceError`, `UserRepositoryError`, and `DatabaseError`.

## Task 6 - Social and Content Repositories

- `ProfileRepository`, `ArticleRepository`, `CommentRepository`, and `TagRepository` are all class-based `Context.Service` layers that acquire `RealWorldConfig` and SQL dependencies in `Layer.effect`.
- Repository error channels are explicit; the infrastructure grep gate is `rg "Effect\\.Effect<[^\\n]*unknown|, unknown[>,)]|readonly .*unknown" examples/realworld/src/infrastructure -n`.
- Article listing supports RealWorld global filters for tag, author, favorited username, limit, and offset; feed lists articles from followed authors only.
- Article writes normalize tags, preserve tags when `tagList` is absent, remove all tags for an empty `tagList`, generate unique slugs, and maintain favorite counts through real SQLite rows.
- Comment repository methods return `Option` for unknown article/comment targets, support selective owner deletion, and hydrate author profiles from real user rows.

## Task 7 - Application Services

- Application services now live in `src/application/{Users,Profiles,Articles,Comments,Tags}.ts` with `Context.Service` classes and `Layer.effect` constructors.
- `src/application/Common.ts` owns token resolution, optional viewer lookup, RealWorld error helpers, blank-field validation, and `UserResponse` shaping.
- `RealWorldError` is a tagged domain error with `{ status, errors }`, matching the API envelope and current service tests.
- Protected workflows use `Option<OpaqueToken>`; missing tokens map to `401 errors.token[0] == "is missing"` before repository access.
- Article and comment ownership checks happen in application services so repository `Option`/boolean results become `404` or `403` RealWorld errors.
- Effect 4 uses `Effect.catch(...)`; `Effect.catchAll` is not available in this workspace.

## Task 8 - API Endpoint Modules

- RealWorld API helpers live under `src/api-support`, not `src/api`, because the HttpApi virtual-module scanner treats every non-reserved file in `src/api` as an endpoint primary module.
- Endpoint primary modules export `route`, `method`, schemas, and raw `HttpServerResponse` handlers so application `RealWorldError` values can map to dynamic HTTP statuses and RealWorld error envelopes.
- `_api.ts` owns the `/api` prefix and exposes JSON OpenAPI at `/api/docs/openapi.json`; Swagger and Scalar UI paths are intentionally disabled.
- The generated `api:` source is tested through `createHttpApiVirtualModulePlugin` and direct endpoint handlers because Vite/Rolldown currently cannot runtime-import the TS-heavy generated virtual module without separate generator hardening.
- Task 8 verification used `pnpm --filter typed-realworld test:integration -- src/tests/api` and `pnpm --filter typed-realworld build`.

## Task 9 - SSR Route Modules

- Subagent routing decision was direct execution: target route/presentation/test files were already known from the plan, and this Codex session only allows spawned agents when the user explicitly asks for them.
- SSR tests import `src/ssr.ts` directly instead of `src/server.ts` because static `api:./api` imports still hit the Vite/Rolldown TS-virtual-module parse limitation during runtime tests.
- `renderUrl(url)` renders the exported `Routes` matcher through `renderToHtmlString`, `ServerRouter`, and `StaticHtmlRenderTemplate`; it does not manually dispatch paths.
- `src/routes/**` route modules use `Route.Parse`/`RouteHandler` and call application services directly for feeds, tag feeds, article detail, comments, profile articles, and profile favorites.
- `src/routes/_layout.ts` owns the shared shell through router layout support; presentation modules return `@typed/template` `html` templates rather than manually wrapped strings.
- `src/server.ts` is the active `typed:server?routes=./routes&api=./api&html=../index.html&client=./browser.ts` entry; `src/browser.ts` runs `typed:browser?routes=./browser-routes`, with source-level tests locking the generated `api:`, `router:`, `ssrForHttp`, and `DomRenderTemplate` usage.
- `typed:browser` initially failed the RealWorld Vite build because the generator imported a non-existent named root export `drainLayer` from `@typed/fx`; the generator now emits the public `Fx.drainLayer(...)` API.
- `typed:browser` generated code imports `composeWithLayers` from `@typed/app/runtime`, not the package root, so browser bundles do not traverse Node-heavy app virtual-module/server exports.
- `src/browser-routes/**` is the browser-safe route tree for hydration and shares route declarations from `src/routing/Routes.ts`; keep server data-loading handlers in `src/routes/**` so SQLite/password/session dependencies stay out of the client bundle.
- After the browser route split, the Vite client chunk dropped from roughly 3.8 MB to roughly 265 kB. One remaining Vite warning comes from Effect Schema pulling `effect/dist/testing/TestSchema.js` through router schema internals, not from RealWorld server dependencies.
- Task 9 verification used `pnpm --filter typed-realworld test:ssr` and `pnpm --filter typed-realworld build`.

## Task 10 - Browser Auth Runtime

- `src/browser.ts` now runs both `typed:browser?routes=./browser-routes` and an auth initialization Effect that installs `window.__conduit_debug__`.
- Browser auth state lives in `src/presentation/State.ts` and uses `@typed/fx` `RefSubject` with a synchronous snapshot for the RealWorld debug contract.
- `src/presentation/ClientApi.ts` is the same-origin browser API boundary; it decodes `UserResponse` and RealWorld error envelopes with Effect Schema and distinguishes HTTP, network, and decode failures.
- Auth initialization clears stale tokens on current-user 4xx responses, but keeps tokens and reports `unavailable` for network, 5xx, and decode failures so transient outages do not log the user out.
- Login and register calls store the returned `jwtToken`; logout clears both `localStorage.getItem("jwtToken")` and the legacy `localStorage.jwtToken` property compatibility path.

## Task 10 - Browser Form Workflows

- Form pages follow the TodoMVC shape: `@typed/template` templates bind `EventHandler.make` intents, and mutation handlers stay as thin Effect workflows rather than manual DOM wrappers.
- `BrowserAuth.Live` is provided through `typed:browser` `run({ layers })`, so route templates can depend on the auth store without manually wrapping route output.
- Browser form inputs are decoded with the existing `RealWorldApi` Effect schemas before calling workflows, preserving branded request types instead of casting raw strings.
- The same-origin client now covers settings, create/update/delete article, favorite/unfavorite, follow/unfollow, create/delete comment, plus no-content responses.
- SSR routes and browser route modules now use real auth/settings/editor form templates instead of `PlaceholderPage`; remaining Task 10 work should focus on visible error rendering, navigation/refresh behavior, and broader hydration assertions.
