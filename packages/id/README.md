# @typed/id

> **Beta:** This package is in beta; APIs may change.

`@typed/id` provides **type-safe ID generation** (Effect-based) for multiple formats: **Cuid**, **Ksuid**, **NanoId**, **Ulid**, **Uuid4**, **Uuid5**, **Uuid7**, plus **DateTimes**, **Ids**, and **RandomValues**. Each typically exposes a branded Schema and an Effect that generates the ID (often requiring a service like `RandomValues` or `CuidState`). Use it when you need typed, reproducible IDs in Effect programs.

## Dependencies

- `effect`

## API overview

- **Cuid** — Schema + type; `CuidState` service; Effect to generate Cuid.
- **Ksuid** — K-sortable unique IDs.
- **NanoId** — Schema + type + `nanoId` Effect (depends on `RandomValues`).
- **Ulid** — ULID schema and generation.
- **Uuid4**, **Uuid5**, **Uuid7** — UUID variants with Schema and generation.
- **DateTimes** — Date/time helpers used by some ID generators.
- **Ids** — Generic ID helpers.
- **RandomValues** — Service for secure random bytes (used by NanoId, etc.).

## Example

```ts
import { Ids, Uuid5Namespace } from "@typed/id";

const id = yield* Ids.cuid;
const id = yield* Ids.ksuid;
const id = yield* Ids.nanoId;
const id = yield* Ids.ulid;
const id = yield* Ids.uuid4;
const id = yield* Ids.uuid5('https://effect.website', Uuid5Namespace.URL);
const id = yield* Ids.uuid7;

// Provide Ids services
effect.Effect.proivde(Ids.Default)
effect.Effect.proivde(Ids.Test())
```
