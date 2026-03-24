# @typed/guard

## Intent

Effect-based guards: composable functions `(input) => Effect<Option<O>, E, R>` that express “maybe this input becomes this output.” Use them for **validation**, **parsing**, and **route matching** when you need a typed, composable “attempt and optionally succeed” abstraction with full Effect support (services, errors, recovery).

## Purpose

Guards sit between raw input and typed output. Unlike `Schema.decode`, which fails on invalid input, guards return `Option`: `Some(output)` when the guard passes, `None` when it does not. This makes them ideal for:

- **Discriminated matching** — Try multiple guards in sequence; first match wins (see `any`).
- **Route matching** — `@typed/router` uses guards to run `matcher.match(route, guard, handler)`; the guard validates/matchs params before the handler.
- **Validation pipelines** — Chain `pipe`, `filter`, `map`, `decode`, `encode` to build complex checks with Effect Schema integration.
- **Conditional logic** — `liftPredicate`, `filterMap`, and `filter` refine types and values in a composable way.

## Capabilities

| Area            | APIs                                                       | Notes                                                                            |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Core**        | `Guard`, `getGuard`, `AsGuard`                             | `Guard<I,O,E,R>` type; `getGuard` unwraps `AsGuard`.                             |
| **Composition** | `pipe`, `map`, `mapEffect`, `filter`, `filterMap`, `tap`   | Chain and transform guards; `pipe` runs second guard on first output.            |
| **Building**    | `liftPredicate`, `any`                                     | From predicates; `any(guards)` for tagged unions (`{ _tag, value }`).            |
| **Schema**      | `fromSchemaDecode`, `fromSchemaEncode`, `decode`, `encode` | Integrate Effect Schema as guards; decode = encoded→type, encode = type→encoded. |
| **Effect**      | `provide`, `provideService`, `provideServiceEffect`        | Provide env; guards can require services.                                        |
| **Recovery**    | `catchAll`, `catchTag`, `catchCause`                       | Turn failures into successful matches (e.g. fallbacks).                          |
| **Struct**      | `addTag`, `bindTo`, `bind`, `let`                          | Build structured outputs; `bind` chains guards and merges.                       |

## Key exports / surfaces

- `Guard`, `GuardInput`, `AsGuard`, `getGuard`, `pipe`, `map`, `mapEffect`, `filter`, `filterMap`, `tap`
- `liftPredicate`, `any` — builders
- `fromSchemaDecode`, `fromSchemaEncode`, `decode`, `encode` — schema integration
- `provide`, `provideService`, `provideServiceEffect` — env
- `catchAll`, `catchTag`, `catchCause` — recovery
- `addTag`, `bindTo`, `bind`, `let` — struct helpers
- Dependencies: `effect`

## Constraints

- Effect skill loading when modifying guard composition: `.cursor/rules/effect-skill-loading.mdc`
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- README for full API reference and examples
- `@typed/router` uses guards for `matcher.match(route, guard, handler)`; see router README
- Root AGENTS.md for bootup/modes
