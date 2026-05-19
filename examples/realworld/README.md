# Typed RealWorld

This package is the full-stack RealWorld/Conduit flagship example for
`@typed/app`. It uses typed virtual modules for API, server, router, browser,
and HTML entrypoints, SQLite-backed services, SSR route rendering, and
`@typed/template` browser workflows.

## Architecture

- Domain schemas and invariants live under `src/domain` and use Effect Schema
  for branded RealWorld request/response types.
- SQLite migrations, seed data, repositories, password hashing, and session
  tokens live under `src/infrastructure`.
- Application services under `src/application` convert repository outcomes into
  typed RealWorld errors and response envelopes.
- API endpoint modules under `src/api` are discovered by the `api:` virtual
  module compiler surface and use inferred `@typed/app` API handlers.
- Route modules under `src/routes` are shared by browser hydration and SSR; page
  data is supplied through environment-specific `PageData` layers.
- Browser workflows under `src/presentation` use `@typed/template`
  `EventHandler` bindings, schema-decoded forms, and a typed auth service layer
  supplied through `typed:browser`.

## Scripts

- `pnpm --filter typed-realworld dev` starts the local Vite dev server.
- `pnpm --filter typed-realworld build` type-checks and builds the package.
- `pnpm --filter typed-realworld test` runs all RealWorld tests.
- `pnpm --filter typed-realworld test:unit` runs package-skeleton/domain tests.
- `pnpm --filter typed-realworld test:integration` runs infrastructure,
  application, and API tests.
- `pnpm --filter typed-realworld test:ssr` runs presentation and SSR tests.
- `pnpm --filter typed-realworld test:acceptance:local` resets the database,
  starts the full app server at `http://127.0.0.1:3000`, runs API acceptance,
  runs browser E2E acceptance, and tears the server down.
- `pnpm --filter typed-realworld test:api:hurl:local` runs the upstream
  RealWorld Hurl API specs from `.temp/references/realworld/specs/api/hurl`.
- `pnpm --filter typed-realworld test:e2e:local` runs the upstream RealWorld
  Playwright specs from `.temp/references/realworld/specs/e2e`.
- `pnpm --filter typed-realworld db:reset` migrates and seeds the configured
  SQLite database.

## Local Acceptance Prerequisites

The local acceptance wrappers reference the upstream spec checkout; they do not
vendor spec files into this example.

The default local acceptance URLs assume a full app server at
`http://127.0.0.1:3000` with API routes under `/api`. The acceptance runner
starts that server through Vite with the `typed.config.ts` server entry, so SSR,
API handlers, and browser hydration share the same route tree.

For the full local gate, install `hurl` and Playwright browsers, then run:

```sh
pnpm --filter typed-realworld exec playwright install chromium
pnpm --filter typed-realworld test:acceptance:local
```

For API acceptance, install `hurl`, start a local RealWorld app server, then run:

```sh
HOST=http://127.0.0.1:3000/api UID_VAL=typed-local \
  pnpm --filter typed-realworld test:api:hurl:local
```

For browser E2E acceptance, install Playwright browsers and start a local
RealWorld app server, then run:

```sh
pnpm --filter typed-realworld exec playwright install chromium
APP_BASE=http://127.0.0.1:3000 API_BASE=http://127.0.0.1:3000/api \
  pnpm --filter typed-realworld test:e2e:local
```

Both wrappers fail with prerequisite messages when the external tools, upstream
spec checkout, browser installation, or app server are missing.

## Known Local Caveats

- The upstream RealWorld reference checkout is intentionally kept under
  `.temp/references/realworld` and is ignored by git.
- `test:api:hurl:local` requires `hurl` on `PATH`; without it, the wrapper exits
  before attempting any network calls.
- `test:e2e:local` requires a running app server at `APP_BASE`; without one, the
  wrapper exits before invoking Playwright.
- The production browser build may warn that Effect Schema imports
  `effect/dist/testing/TestSchema.js`; this warning is currently upstream of the
  example presentation code and does not indicate server dependencies in the
  RealWorld client route tree.
