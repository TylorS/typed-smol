# Typed RealWorld

This package is the full-stack RealWorld/Conduit flagship example for
`@typed/app`. It uses typed virtual modules for API, server, router, browser,
and HTML entrypoints, SQLite-backed services, SSR route rendering, and
`@typed/template` browser workflows.

## Scripts

- `pnpm --filter typed-realworld dev` starts the local Vite dev server.
- `pnpm --filter typed-realworld build` type-checks and builds the package.
- `pnpm --filter typed-realworld test:unit` runs package-skeleton/domain tests.
- `pnpm --filter typed-realworld test:integration` runs infrastructure,
  application, and API tests.
- `pnpm --filter typed-realworld test:ssr` runs presentation and SSR tests.
- `pnpm --filter typed-realworld test:api:hurl:local` runs the upstream
  RealWorld Hurl API specs from `.temp/references/realworld/specs/api/hurl`.
- `pnpm --filter typed-realworld test:e2e:local` runs the upstream RealWorld
  Playwright specs from `.temp/references/realworld/specs/e2e`.

## Local Acceptance Prerequisites

The local acceptance wrappers reference the upstream spec checkout; they do not
vendor spec files into this example.

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
