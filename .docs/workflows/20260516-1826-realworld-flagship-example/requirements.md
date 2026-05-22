# Requirements - RealWorld Flagship Example

Status: draft, expanded after human feedback on 2026-05-16.

## Scope Baseline

The deliverable is a real full-stack `@typed/app` example at `examples/realworld`. It must implement the RealWorld/Conduit API and UI locally, with SQLite persistence, Typed virtual modules, Effect services/layers, Effect Schema at every boundary, real-data SSR, hydrated CSR, local assets, deterministic seed/reset, local/manual upstream acceptance automation, and PR finalization.

The first PR must not vendor the upstream RealWorld spec snapshot and must not wire upstream Hurl/E2E suites into CI. It may wire normal static/package gates such as type-check, test, and build.

## Functional Requirements

### Package and Dependency Shape

- FR-1: Create `examples/realworld` as a single workspace package named `typed-realworld`.
- FR-2: Use folder boundaries inside the package, not separate packages: `src/domain`, `src/application`, `src/infrastructure`, `src/presentation`, `src/api`, and `src/routes`.
- FR-3: The package must use `type: "module"` and follow the existing example package style.
- FR-4: The package must depend on workspace Typed packages only where used: `@typed/app`, `@typed/router`, `@typed/template`, `@typed/ui`, `@typed/fx`, `@typed/async-data`, `@typed/guard`, `@typed/navigation`, `@typed/vite-plugin`, and `@typed/tsconfig`.
- FR-5: The package must use `effect` from the existing catalog.
- FR-6: The package may add approved runtime dependencies only: `@effect/sql-sqlite-node@4.0.0-beta.66` and `micromark@4.0.2`.
- FR-7: The package may add `@playwright/test` as an example-scoped dev dependency for local/manual E2E automation and `happy-dom` as an example-scoped dev dependency for DOM presentation tests.
- FR-8: No Swagger, Scalar, Bootstrap package, CDN, JWT library, bcrypt, Argon2, Redis, Postgres, form library, query-cache library, router library, state library, or external CSS/runtime asset dependency may be added without later approval.

### Typed Virtual Module Surface

- FR-9: The example must use `@typed/app` `api:` virtual modules for RealWorld API endpoint discovery and generated API assembly.
- FR-10: The example must use `@typed/app` `router:` virtual modules for frontend route discovery and matching.
- FR-11: The example must use `typed:server`, `typed:browser`, `typed:html`, `typed:env`, and `typed:config` where those virtual modules are compatible with the current framework surface.
- FR-12: API endpoint files must export `route`, `method`, and `handler` using the conventions documented by `packages/app/README.md` and `.docs/specs/httpapi-virtual-module-plugin/spec.md`.
- FR-13: Route files must export `route` and exactly one route entrypoint (`handler`, `template`, or `default`) using the conventions documented by `.docs/specs/router-virtual-module-plugin/spec.md`.
- FR-14: The API root must use `_api.ts` conventions to set the `/api` prefix and expose OpenAPI JSON.
- FR-15: The API root must expose OpenAPI JSON only. Swagger/Scalar/docs UI exposure is out of scope.
- FR-16: The example must use `@typed/template` for server HTML rendering and browser rendering/hydration.
- FR-17: The example must use `@typed/ui` `Link` or equivalent Typed navigation primitives for in-app links where practical.
- FR-18: The example must use `@typed/fx` and `RefSubject` for reactive client/application state that drives UI updates.
- FR-19: The example must use `@typed/async-data` where remote-data states need loading, success, refresh, error, or optimistic-state representation.
- FR-20: The example must use `@typed/guard` where schema-backed route or request guard composition reduces unchecked branching.

### Effect Architecture

- FR-21: All domain entities, DTOs, request payloads, response payloads, query payloads, path payloads, local storage payloads, and error envelopes must be modeled with Effect Schema.
- FR-22: Application services, infrastructure services, repositories, password/session helpers, and replaceable browser services must be exported as class-based Effect `Context.Service` values, not as raw interface-only dependency contracts.
- FR-23: Use Effect `Layer` composition as the constructor mechanism for services: `Layer.effect(Service, Effect.gen(...))`, `Layer.sync(Service, ...)`, or service-local `make` effects that acquire dependencies and return the implementation object.
- FR-24: Use typed domain/application errors, preferably `Data.TaggedError` or equivalent structural tagged errors, before mapping to RealWorld HTTP errors.
- FR-25: Use Effect `Option` for optional current user, optional profile fields, optional query filters, and optional auth/session contexts where absence is meaningful.
- FR-26: Use Effect `Match` or explicit discriminated matching for UI/application state branches where multiple typed states exist.
- FR-27: Use Effect pure modules such as `Array`, `Record`, `String`, `Boolean`, and `Predicate` instead of adding utility dependencies.
- FR-28: Use Effect `Clock`/`DateTime` seams for timestamps so tests can be deterministic where current APIs support it.
- FR-29: Isolate `effect/unstable/httpapi`, `effect/unstable/http`, and `effect/unstable/sql` imports behind local modules or services so domain and application code are not coupled to unstable APIs.

### RealWorld API Contract

- FR-30: The local API must serve every endpoint under same-origin `/api`; it must not delegate backend behavior to `https://api.realworld.show/api`.
- FR-31: All protected endpoints must accept `Authorization: Token <token>`.
- FR-32: Missing auth for protected endpoints must return `401` with `{ errors: { token: ["is missing"] } }`.
- FR-33: Invalid login credentials must return `401` with `{ errors: { credentials: ["invalid"] } }`.
- FR-34: Validation failures must return `422` with `{ errors: Record<string, string[]> }` and Hurl-observed messages such as `can't be blank`.
- FR-35: Duplicate username/email registration failures must return `409` with `has already been taken` on the duplicate field.
- FR-36: Forbidden article update/delete must return `403` with `{ errors: { article: ["forbidden"] } }`.
- FR-37: Forbidden comment delete must return `403` with `{ errors: { comment: ["forbidden"] } }`.
- FR-38: Missing article/profile/comment resources must return `404` using the resource key and `not found`.
- FR-39: Delete article and delete comment success responses must return `204` with no response body.
- FR-40: List endpoints must return `articles` plus `articlesCount`; `articlesCount` must be total matching rows, not current page length.
- FR-41: Article list/feed preview items must omit `body`; single article responses must include `body`.
- FR-42: Timestamps returned by the API must be ISO strings matching the upstream Hurl prefix expectations.
- FR-43: Article ordering must be newest-first for global, tag, author, favorited, and feed queries.
- FR-44: Pagination query params must support `limit` and zero-based `offset`; UI page 2 must map to `offset=10` for page size 10.
- FR-45: Article slug generation must be stable, URL-safe, and unique even when duplicate titles are allowed.
- FR-46: Article `tagList` order must be preserved on create and full update.
- FR-47: Updating an article without `tagList` must preserve existing tags.
- FR-48: Updating an article with `tagList: []` must remove all tags.
- FR-49: Updating an article with `tagList: null` must return `422`.
- FR-50: Feed must require auth and return only articles authored by followed users.
- FR-51: A new user with no follows must receive an empty feed.
- FR-52: Favorite/unfavorite must update `favorited`, `favoritesCount`, and `GET /api/articles?favorited=:username`.
- FR-53: Comments must have integer `id` values and preserve enough insertion/order behavior to satisfy the upstream comments tests.
- FR-54: Tags endpoint must return all known tags in deterministic order.

### Endpoint Matrix

| ID | Method | Path | Auth | Success | Required behavior |
| -- | ------ | ---- | ---- | ------- | ----------------- |
| EP-1 | POST | `/api/users` | no | `201 { user }` | Register user; reject blank username/email/password; reject duplicate username/email. |
| EP-2 | POST | `/api/users/login` | no | `200 { user }` | Login user; reject blank email/password; reject invalid credentials. |
| EP-3 | GET | `/api/user` | yes | `200 { user }` | Return current user from session token. |
| EP-4 | PUT | `/api/user` | yes | `200 { user }` | Update username/email/password/bio/image; reject blank/null username/email; reject blank/null/short password; normalize blank bio/image to null. |
| EP-5 | GET | `/api/profiles/:username` | optional | `200 { profile }` | Return profile and viewer-specific `following`. |
| EP-6 | POST | `/api/profiles/:username/follow` | yes | `200 { profile }` | Follow profile idempotently enough for local tests. |
| EP-7 | DELETE | `/api/profiles/:username/follow` | yes | `200 { profile }` | Unfollow profile idempotently enough for local tests. |
| EP-8 | GET | `/api/articles` | optional | `200 { articles, articlesCount }` | Support `tag`, `author`, `favorited`, `limit`, `offset`; omit `body`. |
| EP-9 | GET | `/api/articles/feed` | yes | `200 { articles, articlesCount }` | Support `limit`, `offset`; followed authors only; omit `body`. |
| EP-10 | POST | `/api/articles` | yes | `201 { article }` | Create article with title/description/body/tagList; generate unique slug. |
| EP-11 | GET | `/api/articles/:slug` | optional | `200 { article }` | Return full article with `body`. |
| EP-12 | PUT | `/api/articles/:slug` | yes, author | `200 { article }` | Update title/description/body/tagList with preservation/removal/null rules. |
| EP-13 | DELETE | `/api/articles/:slug` | yes, author | `204` | Delete article plus dependent comments, favorites, and `article_tags` rows by foreign-key cascade; keep standalone `tags` rows. |
| EP-14 | POST | `/api/articles/:slug/favorite` | yes | `200 { article }` | Favorite article and return updated article. |
| EP-15 | DELETE | `/api/articles/:slug/favorite` | yes | `200 { article }` | Unfavorite article and return updated article. |
| EP-16 | GET | `/api/articles/:slug/comments` | optional | `200 { comments }` | Return comments with authors. |
| EP-17 | POST | `/api/articles/:slug/comments` | yes | `201 { comment }` | Create comment; reject blank body. |
| EP-18 | DELETE | `/api/articles/:slug/comments/:id` | yes, comment author | `204` | Delete comment or return forbidden/not-found. |
| EP-19 | GET | `/api/tags` | no | `200 { tags }` | Return known tags. |
| EP-20 | GET | OpenAPI JSON path from `_api.ts` | no | `200 OpenAPI JSON` | Generated through HttpApi integration, not handcrafted. |

### Auth and User Rules

- FR-55: User response must include `username`, `email`, `bio`, `image`, and `token`.
- FR-56: Newly registered users must have `bio: null` and `image: null`.
- FR-57: `PUT /api/user` must accept `bio: null` and `image: null`.
- FR-58: `PUT /api/user` must normalize empty string `bio` and `image` to persisted `null`.
- FR-59: `PUT /api/user` must reject `username: ""`, `username: null`, `email: ""`, and `email: null`.
- FR-60: Password updates must reject empty string, null, and shorter-than-8 values.
- FR-61: Password updates must accept 8-character and 64-character values.
- FR-62: Passwords must be hashed via a replaceable `PasswordHasher` service backed initially by Node built-in `crypto.scrypt`.
- FR-63: Opaque tokens must be persisted server-side and invalidated only by reset or explicit future behavior; JWT signing/parsing is not required.
- FR-64: Browser auth must store the opaque token at `localStorage.jwtToken` for RealWorld E2E compatibility.

### Domain Model Inventory

- FR-65: Define branded or schema-refined identifiers for `UserId`, `ArticleId`, `CommentId`, `SessionId`, `Slug`, `Username`, `Email`, and `TagName` where compatible with the current Effect Schema API.
- FR-66: Define domain schemas for `User`, `PublicUser`, `Profile`, `Article`, `ArticlePreview`, `Comment`, `Tag`, `Session`, and `ArticleFilter`.
- FR-67: Define API schemas for `UserResponse`, `ProfileResponse`, `SingleArticleResponse`, `MultipleArticlesResponse`, `SingleCommentResponse`, `MultipleCommentsResponse`, `TagsResponse`, and `ErrorResponse`.
- FR-68: Define request schemas for register, login, update user, create article, update article, create comment, article list query, feed query, and route path params.
- FR-69: Define local storage schema for the browser token and current-user state.
- FR-70: Define presentation state schemas or discriminated types for auth state: `loading`, `authenticated`, `unauthenticated`, and `unavailable`.

### Required Schema Export Detail

| module | required exports | required proof |
| ------ | ---------------- | -------------- |
| `src/domain/Ids.ts` | `UserId`, `ArticleId`, `CommentId`, `SessionId`, `Slug`, `Username`, `Email`, `TagName`, constructors/refinements for each. | Unit tests decode valid values, reject blank/invalid values, and preserve opaque/branded typing at call sites. |
| `src/domain/User.ts` | `User`, `PublicUser`, `Profile`, `Session`, `normalizeNullableProfileField`, `toProfile`, `toUserResponseUser`. | Unit tests prove null/empty-string handling, profile shape, user response shape, and missing-avatar behavior. |
| `src/domain/Article.ts` | `Article`, `ArticlePreview`, `Comment`, `Tag`, `ArticleFilter`, tag-list helpers, article response mappers. | Unit tests prove body omission for previews, tag order, counts, author shape, and timestamp serialization. |
| `src/domain/Auth.ts` | `AuthHeader`, `BearerToken`, `parseAuthorizationHeader`, `requireToken`. | Unit tests prove only `Token <token>` is accepted and missing/malformed tokens map to RealWorld token errors. |
| `src/domain/Pagination.ts` | `Limit`, `Offset`, `Page`, `defaultLimit`, `toOffset`, `decodeListQuery`. | Unit tests prove default limit/offset and page 2 to offset 10 behavior. |
| `src/domain/Markdown.ts` | `renderMarkdown`, `stripUnsafeHtml`, `safeTextPreview`. | Unit tests prove raw HTML is escaped and unsafe URI/event-handler payloads do not enter rendered markup. |
| `src/domain/RealWorldApi.ts` | all request, response, query, path, local-storage, and error envelope schemas. | Round-trip schema tests cover every RealWorld request/response envelope and reject malformed payloads. |
| `src/domain/Errors.ts` | tagged domain/application errors and RealWorld error envelope builders. | Unit tests prove status/key/message mapping before endpoint modules use the errors. |

### Persistence and Local Data

- FR-71: Store the default SQLite file at `examples/realworld/.data/realworld.sqlite`.
- FR-72: Add an ignore rule for `examples/realworld/.data/`.
- FR-73: Provide migrations for users, sessions, follows, articles, tags, article_tags, favorites, and comments.
- FR-74: Add unique constraints for username, email, session token, article slug, tag name, follows `(follower_id, followed_id)`, favorites `(user_id, article_id)`, and article_tags `(article_id, tag_id)`.
- FR-75: Use foreign keys and cascade delete where it preserves RealWorld behavior for article comments/favorites/tags joins.
- FR-76: Provide deterministic seed data with at least two users, at least one follow relationship, at least fifteen globally visible articles across multiple tags, at least one favorite, at least one comment, and at least one missing-avatar user.
- FR-77: Seed tags must not collide with Hurl-generated unique tags or E2E-generated unique tags.
- FR-78: Reset must delete/recreate the SQLite database, run migrations, and apply seed data.
- FR-79: Repository APIs must support transactions for multi-table workflows such as article creation, article update tags, favorite/unfavorite, follow/unfollow, and comment delete.

### Database Schema Contract

| table | required columns | required constraints/indexes |
| ----- | ---------------- | ---------------------------- |
| `users` | `id`, `username`, `email`, `password_hash`, `password_salt`, `bio`, `image`, `created_at`, `updated_at` | unique `username`, unique `email`; indexes on `username` and `email`. |
| `sessions` | `id`, `user_id`, `token`, `created_at`, `last_seen_at` | unique `token`; foreign key to `users(id)` with cascade delete. |
| `follows` | `follower_id`, `followed_id`, `created_at` | unique `(follower_id, followed_id)`; indexes on both columns; foreign keys to `users(id)` with cascade delete. |
| `articles` | `id`, `author_id`, `slug`, `title`, `description`, `body`, `created_at`, `updated_at` | unique `slug`; index on `author_id`; index on `created_at`; foreign key to `users(id)` with cascade delete. |
| `tags` | `id`, `name`, `created_at` | unique `name`; index on `name`. |
| `article_tags` | `article_id`, `tag_id`, `position` | unique `(article_id, tag_id)`; unique `(article_id, position)`; foreign keys to `articles(id)` and `tags(id)` with cascade delete. |
| `favorites` | `user_id`, `article_id`, `created_at` | unique `(user_id, article_id)`; indexes on both columns; foreign keys to `users(id)` and `articles(id)` with cascade delete. |
| `comments` | `id`, `article_id`, `author_id`, `body`, `created_at`, `updated_at` | indexes on `article_id`, `author_id`, `created_at`; foreign keys to `articles(id)` and `users(id)` with cascade delete. |

### Repository Contract Detail

| service | required operations | transaction requirements |
| ------- | ------------------- | ------------------------ |
| `UserRepository` | Export `class UserRepository extends Context.Service<...>()(...)` with create user, find by id, find by email, find by username, find by token, create session, update user fields, update password hash, record session last seen. | The `Layer.effect(UserRepository, Effect.gen(...))` constructor acquires SQL dependencies. Registration and update must be atomic across user/session/password fields. |
| `ProfileRepository` | Export `class ProfileRepository extends Context.Service<...>()(...)` with get profile by username for optional viewer, follow, unfollow, list followed author ids. | The layer constructor acquires `SqlClient`/transaction support. Follow/unfollow must be idempotent from the API caller's perspective. |
| `ArticleRepository` | Export `class ArticleRepository extends Context.Service<...>()(...)` with create article, allocate unique slug, get full article, list article previews, list feed previews, update article fields, replace/remove tags, delete article, count favorites, check ownership. | The layer constructor acquires SQL dependencies. Create/update/favorite/delete must be atomic across article rows, tag rows, joins, favorites, and counts. |
| `CommentRepository` | Export `class CommentRepository extends Context.Service<...>()(...)` with list comments for article, create comment, get comment author, delete comment, check ownership. | The layer constructor acquires SQL dependencies. Create/delete must validate article existence and ownership in one workflow. |
| `TagRepository` | Export `class TagRepository extends Context.Service<...>()(...)` with list deterministic tags and ensure tags exist for article operations. | The layer constructor acquires SQL dependencies. Tag insertion plus article-tag joins must preserve article tag positions. |

### Application Service Contract Detail

| service | required workflows | required effects |
| ------- | ------------------ | ---------------- |
| `Users` | Export `class Users extends Context.Service<...>()(...)` with register, login, current user, update current user. | Its layer constructor acquires `PasswordHasher`, `SessionTokens`, and `UserRepository`; workflows use Schema decoding, duplicate checks, and RealWorld error mapping. |
| `Profiles` | Export `class Profiles extends Context.Service<...>()(...)` with get profile, follow, unfollow. | Its layer constructor acquires `ProfileRepository` and optional viewer helpers; workflows return viewer-specific `following`. |
| `Articles` | Export `class Articles extends Context.Service<...>()(...)` with global list, feed list, create, get, update, delete, favorite, unfavorite. | Its layer constructor acquires repositories and transaction helpers; workflows apply slug generation, ownership checks, filter decoding, tag preservation/removal rules, and preview/full response mapping. |
| `Comments` | Export `class Comments extends Context.Service<...>()(...)` with list, create, delete. | Its layer constructor acquires `CommentRepository` and `ArticleRepository`; workflows enforce article existence, auth, blank-body validation, ownership checks, and integer IDs. |
| `Tags` | Export `class Tags extends Context.Service<...>()(...)` with list tags. | Its layer constructor acquires `TagRepository`; workflows use deterministic repository order and response schema encoding. |

### Seed Data Contract

- FR-80: Seed must create a reader user, author user, and secondary author user with stable usernames that do not look like upstream generated test usernames.
- FR-81: Seed must create at least fifteen published articles so default pagination has more than one page.
- FR-82: Seed must create at least five tags, including `typed`, `effect`, `realworld`, `sqlite`, and `ssr`.
- FR-83: Seed must create at least one author with `image: null` so default-avatar paths are testable.
- FR-84: Seed must create at least one profile follow relationship.
- FR-85: Seed must create at least one favorite and one comment.
- FR-86: Seeded article titles/slugs/tags must not collide with Hurl UID-based data or E2E generated data.

### Frontend Routes and SSR

- FR-87: The app must render `/` as Global Feed with real seeded or database-backed articles.
- FR-88: The app must render `/?feed=following` as Your Feed; unauthenticated users must see a compatible empty/auth-required state rather than a crash.
- FR-89: The app must render `/?page=N` as paginated Global Feed with page size 10.
- FR-90: The app must render `/tag/:tag` and `/tag/:tag?page=N` as tag-filtered feeds.
- FR-91: The app must render `/login` and `/register` forms with required headings and input names.
- FR-92: The app must render `/editor` for new articles and `/editor/:slug` for editing existing articles.
- FR-93: The app must render `/settings` with user settings fields and logout button.
- FR-94: The app must render `/profile/:username` and `/profile/:username/favorites`.
- FR-95: The app must render `/article/:slug` with full article body, article meta, favorite/follow controls, comments, and comment form when authenticated.
- FR-96: SSR for feeds, tag pages, article detail, and profile pages must read real local services/repositories, not the browser API and not mock data.
- FR-97: Browser hydration must preserve the SSR page state and then allow local API refresh/mutation.

### Route Data Contract Detail

| route | SSR data source | required initial HTML evidence |
| ----- | --------------- | ------------------------------ |
| `/` | `Articles.list` and `Tags.list` application services. | At least one seeded article title, one author username, global feed tab, tag sidebar, and pagination when more than 10 articles exist. |
| `/?feed=following` | `Articles.feed` when authenticated; unauthenticated fallback otherwise. | Your Feed tab and a non-crashing auth/empty state. |
| `/?page=N` | `Articles.list` with decoded pagination. | Active page class on `N`, page-size 10 behavior, and no duplicate article previews across page 1/page 2 seed data. |
| `/tag/:tag` | `Articles.list` filtered by tag plus `Tags.list`. | Tag feed tab, selected tag text, and only matching tagged articles. |
| `/article/:slug` | `Articles.get` plus `Comments.list`. | Full body HTML, article meta, favorite/follow controls, comments, and comment form state. |
| `/profile/:username` | `Profiles.get` plus authored `Articles.list`. | Profile username, avatar/default avatar, follow/settings control, and authored article previews. |
| `/profile/:username/favorites` | `Profiles.get` plus favorited `Articles.list`. | Favorited tab and only articles favorited by that profile. |

### Client State Contract Detail

| state area | required primitive | required transitions |
| ---------- | ------------------ | -------------------- |
| Auth | `RefSubject` plus local-storage schema. | `loading -> authenticated`, `loading -> unauthenticated`, `loading -> unavailable`, logout to unauthenticated, 4xx `/api/user` clears token. |
| Feed | `RefSubject` plus `AsyncData`. | SSR seed data hydrates as success, filter/page changes refresh from local API, mutation refresh preserves visible navigation. |
| Article detail | `RefSubject` plus `AsyncData`. | Favorite/unfavorite and comment create/delete update the article/comment state without full page reload. |
| Profile | `RefSubject` plus `AsyncData`. | Follow/unfollow updates profile `following` and profile article controls. |
| Editor/settings/forms | `RefSubject` for field state and errors. | Submit success navigates/updates state; validation/network/API errors render `.error-messages`. |

### UI Selector and Compatibility Contract

- FR-98: Include form selectors required by upstream E2E: `input[name=username]`, `input[name=email]`, `input[name=password]`, `input[name=title]`, `input[name=description]`, `textarea[name=body]`, `input[name=image]`, `textarea[name=bio]`, `input[placeholder="Enter tags"]`, and `textarea[placeholder="Write a comment..."]`.
- FR-99: Include required layout/navigation classes: `.navbar`, `.navbar-brand`, `.nav-link`, `.banner`, and `.container`.
- FR-100: Include required feed/article classes: `.feed-toggle`, `.article-preview`, `.article-meta`, `.article-content`, `.article-page`, `.preview-link`, `.author`, and `.empty-feed-message`.
- FR-101: Include required tag classes: `.sidebar`, `.tag-list`, `.tag-default`, and `.tag-pill`.
- FR-102: Include required comment classes: `.card`, `.card-block`, `.comment-form`, `.comment-author-img`, `.mod-options`, and `.ion-trash-a`.
- FR-103: Include required profile classes: `.profile-page`, `.user-info`, `.user-img`, and `.user-pic`.
- FR-104: Include required pagination classes: `.pagination`, `.page-item`, and active page class `active`.
- FR-105: Include required button classes: `.btn-outline-primary`, `.btn-primary`, and `.btn-outline-danger`.
- FR-106: Include `.error-messages` for validation, API, and network errors.
- FR-107: Include required visible text labels: `Sign in`, `Sign up`, `Global Feed`, `Your Feed`, `Post Comment`, `Publish Article`, `Update Settings`, `Or click here to logout`, `Edit Article`, `Delete Article`, `Favorite`, `Unfavorite`, `Favorite Article`, `Follow`, `Unfollow`, `Favorited`, `Edit Profile Settings`, and `Home`.
- FR-108: Expose `window.__conduit_debug__` with `getToken()`, `getAuthState()`, and `getCurrentUser()`.
- FR-109: `getAuthState()` must return exactly `authenticated`, `unauthenticated`, `unavailable`, or `loading`.
- FR-110: `getCurrentUser()` must return the current user shape or `null`, with nullable `bio` and `image`.
- FR-111: Null or empty avatars must render image `src` containing `default-avatar.svg` for `.user-img`, `.user-pic`, `.comment-author-img`, and `.article-meta img`.
- FR-112: Null `bio` must render as an empty string or omitted display text, never literal `null`.

### Markdown and XSS Safety

- FR-113: Render article body Markdown through `micromark@4.0.2`.
- FR-114: Raw HTML in Markdown must be escaped rather than preserved as executable DOM.
- FR-115: Rendered article content must not create `<script>` elements from article body or description inputs.
- FR-116: Rendered image/avatar URLs must not create `onerror`, `onload`, `onmouseover`, `onclick`, or `onfocus` attributes.
- FR-117: JavaScript URLs and data-URI script payloads must not execute or trigger dialogs.
- FR-118: Article descriptions in feed previews must be text-rendered or safely escaped.

### Browser Error and Resilience Behavior

- FR-119: 4xx `/api/user` initialization failures must clear `localStorage.jwtToken` and show logged-out navigation.
- FR-120: 5xx, network, timeout, malformed JSON, or schema decode failures on `/api/user` initialization must keep `localStorage.jwtToken` and move auth state to `unavailable`.
- FR-121: Form submission network failures must show `.error-messages` with `Unable to connect` or an equivalent approved message.
- FR-122: API validation errors must display all relevant error messages in `.error-messages`.
- FR-123: Article/profile/feed load failures must show a non-blank fallback/error state and keep navigation usable.

### Local Scripts and Verification

- FR-124: Package scripts must include `dev`, `build`, `preview`, `test`, `test:unit`, `test:integration`, `test:ssr`, `test:e2e:local`, `test:api:hurl:local`, `db:reset`, `db:migrate`, and `db:seed`.
- FR-125: `test:api:hurl:local` must run or delegate to the upstream Hurl files under `.temp/references/realworld/specs/api/hurl` and document `hurl` prerequisites.
- FR-126: `test:e2e:local` must run or delegate to the upstream Playwright specs under `.temp/references/realworld/specs/e2e` and document browser/tool prerequisites.
- FR-127: Local/manual acceptance scripts must start or require a local app server consistently and must accept configurable host/port environment variables.
- FR-128: CI must not run upstream Hurl/E2E for the first PR.
- FR-129: CI may run normal type-check/build/test gates for `typed-realworld` and related packages.

### Layer Construction Contract

- FR-130: Each service module must expose the `Context.Service` class as the primary dependency token and must not make a raw TypeScript interface the runtime dependency identity.
- FR-131: Each replaceable service must expose at least one production layer named consistently (`Default`, `Live`, or `Sqlite`) using `Layer.effect` or `Layer.sync`.
- FR-132: Service layer constructors must acquire dependencies inside `Effect.gen` with `yield* DependencyService`, then return the implementation object. This mirrors ordinary constructor injection: `new Dep(); new Thing(dep)`.
- FR-133: Test doubles must use `Layer.succeed`, `Layer.sync`, `Layer.effect`, or `Layer.mock` with the service class, rather than monkey-patching module-level variables.
- FR-134: Static helper methods on service classes may be used to make call sites ergonomic, but they must delegate through the service context (`Effect.flatMap(Service, ...)`) rather than importing concrete implementations.
- FR-135: The canonical `@typed/app` endpoint helper name must be `ApiHandler`; `defineApiHandler` must not be used by the RealWorld example, updated docs, templates, or specs.
- FR-136: If `@typed/app` still exports or documents `defineApiHandler`, this project must include a framework cleanup slice that removes the public alias and updates tests/docs/templates to `ApiHandler`.
- FR-137: The canonical public helper shape must be `ApiHandler(route, method, schemas?)(handler)` for endpoint files; `@typed/app` must not expose two different public `ApiHandler` call shapes for the same endpoint-helper role.
- FR-138: The current config-object `ApiHandler({ route, method, ... })(handler)` surface must be removed, renamed, or made internal before the RealWorld example lands, unless the human explicitly approves keeping it as a separate public API under a different name.

### Verification Gate Matrix

| gate | command | first PR CI | release meaning |
| ---- | ------- | ------------ | --------------- |
| Unit/domain | `pnpm --filter typed-realworld test:unit` | yes | Schema and pure invariants are correct. |
| Integration | `pnpm --filter typed-realworld test:integration` | yes | SQLite repositories, services, and API contracts are correct. |
| SSR | `pnpm --filter typed-realworld test:ssr` | yes | Real-data server rendering works. |
| Build | `pnpm --filter typed-realworld build` | yes | Example compiles and bundles. |
| Hurl local | `pnpm --filter typed-realworld test:api:hurl:local` | no | Local API is compatible with upstream Hurl specs. |
| E2E local | `pnpm --filter typed-realworld test:e2e:local` | no | Local UI is compatible with upstream shared E2E specs. |
| Framework focused | `pnpm --filter @typed/app test && pnpm --filter @typed/app build` | yes where current CI permits | App virtual module changes remain healthy. |
| Root final | `pnpm -r run test && pnpm -r build && pnpm build && git diff --check` | yes where current CI permits | Repo-wide health before PR finalization. |

## Non-Functional Requirements

- NFR-1: The implementation must remain TypeScript strict-compatible with the repo's current TypeScript configuration.
- NFR-2: Functions should remain small and focused; any function exceeding roughly 30 lines needs a clear reason in code shape.
- NFR-3: Domain and application modules must not import browser-only, Vite-only, or SQL adapter-specific modules.
- NFR-4: Infrastructure modules may import unstable Effect SQL/HTTP APIs but must keep those imports behind replaceable service boundaries.
- NFR-5: API endpoint modules must stay thin: decode/route/HTTP mapping only, with business workflows delegated to application services.
- NFR-6: Presentation modules must keep selector compatibility as a hard constraint, even if visual design could be cleaner with different class names.
- NFR-7: Seed/reset must be deterministic enough that repeated local test runs do not depend on previous database state.
- NFR-8: Password hashes and session tokens must never be logged, rendered, or committed.
- NFR-9: The implementation must preserve unrelated dirty worktree changes.
- NFR-10: The final PR should be reviewable as focused slices, preferably with commits per major task group.
- NFR-11: Local/manual Hurl/E2E automation must be documented accurately even when external tools are missing locally.
- NFR-12: Real-data SSR must avoid avoidable HTTP self-calls; server-side rendering should call application services directly.
- NFR-13: Browser state must not duplicate business rules that belong in domain/application services.
- NFR-14: Query behavior must be efficient for local/demo scale: indexed lookup by username, email, slug, tag, favorite, author, and follow relationship.
- NFR-15: OpenAPI exposure must be generated from the HttpApi surface, not handcrafted JSON.
- NFR-16: No local generated SQLite data, upstream spec clone contents, or build output may be committed.

## Acceptance Criteria

- AC-1: `examples/realworld/package.json` exists, uses only approved dependencies, and exposes the required scripts. Maps to FR-1 through FR-8, FR-124 through FR-129, NFR-1, NFR-9, NFR-16.
- AC-2: `examples/realworld/.gitignore` or equivalent ignore coverage excludes `.data/`, and no SQLite data file is staged. Maps to FR-71, FR-72, NFR-16.
- AC-3: `api:` and `router:` virtual module imports build successfully for the example. Maps to FR-9 through FR-14, FR-30, NFR-5.
- AC-4: OpenAPI JSON is served from the HttpApi-generated surface and includes all endpoint groups. Maps to FR-14, FR-15, FR-22, EP-20, NFR-15.
- AC-5: Schema tests verify all domain, API, request, response, query, local storage, and error schemas. Maps to FR-21, FR-65 through FR-70.
- AC-6: Domain invariant tests verify slug uniqueness, tag ordering, tag replacement/removal, nullable normalization, auth header parsing, ownership decisions, pagination offset math, favorite/follow counts, and markdown safety. Maps to FR-45 through FR-49, FR-58 through FR-64, FR-113 through FR-118.
- AC-7: SQLite migration/reset/seed tests create a fresh database at `examples/realworld/.data/realworld.sqlite`, apply all migrations, load deterministic seed, and prove a second reset starts from the same state. Maps to FR-71 through FR-86, NFR-7.
- AC-8: Repository integration tests cover users, sessions, profiles/follows, articles, article_tags, favorites, comments, tags, transactions, not-found behavior, and cascade/delete behavior. Maps to FR-73 through FR-79, EP-1 through EP-19, NFR-14.
- AC-9: Auth API tests cover register, login, get current user, update user, missing token, invalid credentials, duplicate username/email, password policy, nullable bio/image, and token persistence. Maps to EP-1 through EP-4, FR-31 through FR-35, FR-55 through FR-64.
- AC-10: Profile API tests cover optional auth profile reads, follow, unfollow, missing profile, and viewer-specific `following`. Maps to EP-5 through EP-7.
- AC-11: Article API tests cover global list, filters, feed, create, get, update, delete, tags, favorites, unique slugs, preview body omission, timestamp behavior, pagination, and update tag rules. Maps to EP-8 through EP-15, FR-40 through FR-52.
- AC-12: Comment API tests cover list, create, delete, missing article, missing comment, forbidden delete, and integer IDs. Maps to EP-16 through EP-18, FR-37, FR-38, FR-53.
- AC-13: Tags API tests cover deterministic tag list and seed-generated tags. Maps to EP-19, FR-54, FR-76 through FR-86.
- AC-14: SSR smoke tests prove `/`, `/?page=2`, `/tag/:tag`, `/article/:slug`, `/profile/:username`, and `/profile/:username/favorites` render real database-backed content in the first HTML response. Maps to FR-87 through FR-97, NFR-12.
- AC-15: CSR/hydration tests prove navigation, login, register, logout, settings, create article, edit article, favorite/unfavorite, follow/unfollow, comments, local API calls, `RefSubject` state updates, `jwtToken`, and `window.__conduit_debug__`. Maps to FR-17 through FR-20, FR-91 through FR-112.
- AC-16: Selector tests verify every required class, form name, placeholder, visible label, default avatar, pagination active state, and `.error-messages` path. Maps to FR-98 through FR-112.
- AC-17: XSS tests verify article descriptions, article bodies, avatar URLs, and comment/avatar surfaces cannot create scripts, dangerous attributes, JavaScript URL execution, or dialogs. Maps to FR-113 through FR-118, NFR-8.
- AC-18: Browser resilience tests verify `/api/user` 4xx clears token, 5xx/network/malformed responses keep token and set `unavailable`, and form/network failures show `.error-messages`. Maps to FR-119 through FR-123.
- AC-19: `pnpm --filter typed-realworld test:unit` passes. Maps to AC-5, AC-6.
- AC-20: `pnpm --filter typed-realworld test:integration` passes. Maps to AC-7 through AC-13.
- AC-21: `pnpm --filter typed-realworld test:ssr` passes. Maps to AC-14.
- AC-22: `pnpm --filter typed-realworld build` passes. Maps to FR-1 through FR-24, FR-87 through FR-97, FR-130 through FR-134.
- AC-23: `pnpm --filter typed-realworld test:api:hurl:local` is present, documented, and either passes locally or reports missing `hurl` with an exact prerequisite message. Maps to FR-125, FR-127, FR-128, NFR-11.
- AC-24: `pnpm --filter typed-realworld test:e2e:local` is present, documented, and either passes locally or reports missing Playwright/browser prerequisites with an exact prerequisite message. Maps to FR-126, FR-127, FR-128, NFR-11.
- AC-25: Relevant framework checks pass before final PR where feasible: `pnpm --filter @typed/app test`, `pnpm --filter @typed/app build`, `pnpm --filter typed-realworld test`, `pnpm --filter typed-realworld build`, `pnpm -r run test`, `pnpm -r build`, `pnpm build`, and `git diff --check`. Maps to FR-129, NFR-10.
- AC-26: If a root or recursive gate fails because of unrelated pre-existing dirty worktree state, the final report names the exact command, failure, and why the example-local gates are still valid. Maps to NFR-9, NFR-11.
- AC-27: No unapproved runtime dependency, hosted API fallback, local SQLite file, vendored upstream spec snapshot, Swagger/Scalar docs UI, or external CSS/CDN dependency is committed. Maps to FR-8, FR-30, FR-71, FR-128, NFR-16.
- AC-28: Repository, application, password, session, and replaceable browser services are exported as class-based `Context.Service` values and are constructed through `Layer.effect`, `Layer.sync`, `Layer.succeed`, or `Layer.mock` in production/test wiring. Maps to FR-22, FR-23, FR-130 through FR-134.
- AC-29: `rg "defineApiHandler" examples/realworld packages/app packages/cli/templates/starter packages/virtual-modules-ts-plugin/sample-project .docs/specs/httpapi-virtual-module-plugin` returns no results after the cleanup slice, and tests/docs demonstrate only the route/method `ApiHandler(route, method, schemas?)(handler)` public helper. Maps to FR-135 through FR-138.

## Prioritization

- must_have:
  - FR-1 through FR-138.
  - NFR-1 through NFR-16.
  - AC-1 through AC-29.
- should_have:
  - README section explaining the DDD folder shape and Typed/Effect module map.
  - Local smoke script that starts the app, verifies OpenAPI JSON, and probes representative SSR pages.
  - A concise architecture diagram in the example README after implementation proves the final wiring.
- could_have:
  - OpenAPI docs UI if a dependency is explicitly approved later.
  - Promotion into `typed create` after the example proves stable.
  - CI wiring for Hurl/E2E after the first PR if the team wants that gate later.

## Approval Rule

This document is a draft until explicitly approved by the human. It is reviewed together with `plan.md` at the human's request.
