# typed-smol

> **Beta:** This repository and all packages are in **beta**. APIs may change without notice and breaking changes are possible. Use with that in mind and feedback is welcome.

typed-smol is an **Effect-based** monorepo of libraries for building typed UIs and apps: reactive streams, routing, templates, and DOM rendering. It is built on [Effect](https://effect.website/) (this repo uses `effect@4.0.0-beta.4`).

## Packages

| Package | Description |
|---------|-------------|
| [@typed/async-data](packages/async-data/README.md) | Async data states (NoData, Loading, Success, Failure, Optimistic) with Effect Schema and helpers |
| [@typed/fx](packages/fx/README.md) | Reactive primitives: Fx, Push, RefSubject, Subject, Sink, Versioned |
| [@typed/guard](packages/guard/README.md) | Effect-based guards (input → Option) with Schema decode/encode and composition |
| [@typed/id](packages/id/README.md) | ID generation: Cuid, Ksuid, NanoId, Ulid, Uuid4/5/7, date-based, random |
| [@typed/navigation](packages/navigation/README.md) | Navigation (browser/memory) and routing-related types |
| [@typed/router](packages/router/README.md) | Route matching and router (Route, Matcher, CurrentRoute, Router) |
| [@typed/template](packages/template/README.md) | Declarative UI: Html, templates, render, hydration, event handling |
| [@typed/ui](packages/ui/README.md) | Web integration: HttpRouter, Link (builds on router + template + navigation) |

## Requirements

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (workspace uses `pnpm@10.0.0`)

## Setup

From the repo root:

```bash
pnpm install
pnpm build
```

## Examples

- **[Counter](examples/counter/README.md)** — Minimal app using `@typed/fx` and `@typed/template` (reactive state + DOM rendering). See [examples/counter/README.md](examples/counter/README.md) for run instructions.
- **[TodoMVC](examples/todomvc/README.md)** — TodoMVC-style app using `@typed/fx`, `@typed/router`, `@typed/template`, and `@typed/ui`. See [examples/todomvc/README.md](examples/todomvc/README.md) for run instructions.

**Run an example** (after `pnpm install` and `pnpm build` at root):

- **Counter:** `cd examples/counter && pnpm dev` (then `pnpm build`, `pnpm preview` as needed)
- **TodoMVC:** `cd examples/todomvc && pnpm dev` (then `pnpm build`, `pnpm preview` as needed)

## Scripts

From the repo root:

- `pnpm build` — Build all packages
- `pnpm test` — Run tests in all packages
- `pnpm lint` — Lint (oxlint)
- `pnpm format` — Format (oxfmt)

---

*All packages are in beta; APIs are subject to change.*

## Releases

Current beta versions (first public beta release; future betas will use `-beta.1`, `-beta.2`, etc.):

| Package | Version |
|---------|---------|
| @typed/fx | 2.0.0-beta.0 |
| @typed/async-data | 1.0.0-beta.0 |
| @typed/guard | 1.0.0-beta.0 |
| @typed/id | 1.0.0-beta.0 |
| @typed/navigation | 1.0.0-beta.0 |
| @typed/router | 1.0.0-beta.0 |
| @typed/template | 1.0.0-beta.0 |
| @typed/ui | 1.0.0-beta.0 |

Install with the `beta` tag, e.g. `pnpm add @typed/fx@beta`.
