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
Effect.provide(Ids.Default)
Effect.provide(Ids.Test())
```

## API reference

### Ids

Unified service for generating all ID types. Requires `DateTimes`, `RandomValues`, `CuidState`, and `Uuid7State` (use `Ids.Default` or `Ids.Test()` to provide them).

| Member | Type | Description |
|--------|------|-------------|
| `Ids.cuid` | `Effect<Cuid, never, Ids>` | Generate a Cuid. |
| `Ids.ksuid` | `Effect<Ksuid, never, Ids>` | Generate a Ksuid. |
| `Ids.nanoId` | `Effect<NanoId, never, Ids>` | Generate a NanoId. |
| `Ids.ulid` | `Effect<Ulid, never, Ids>` | Generate a ULID. |
| `Ids.uuid4` | `Effect<Uuid4, never, Ids>` | Generate a UUID v4. |
| `Ids.uuid5` | `(name, namespace) => Effect<Uuid5, never, Ids>` | Generate a UUID v5 from a name and namespace. Also has `Ids.uuid5.dns`, `.url`, `.oid`, `.x500` taking a single `name`. |
| `Ids.uuid7` | `Effect<Uuid7, never, Ids>` | Generate a UUID v7. |
| `Ids.Default` | `Layer<Ids \| DateTimes \| RandomValues>` | Layer that provides `Ids` with default Cuid/Uuid7/DateTimes/RandomValues. |
| `Ids.Test(options?)` | `Layer<Ids \| DateTimes \| RandomValues>` | Layer for tests; optional `currentTime` and `envData`. |

**TestOptions:** `{ currentTime?: number | string | Date; envData?: string }`

---

### Cuid

| Export | Type | Description |
|--------|------|-------------|
| `Cuid` | `Schema<string, Cuid>` | Branded schema for Cuid strings. |
| `Cuid` (type) | `string` | Branded Cuid type. |
| `isCuid` | `(value: string) => value is Cuid` | Type guard. |
| `CuidState` | Service | Provides `next: Effect<CuidSeed>`. Used by `cuid`. |
| `CuidState.Default` | `Layer<CuidState>` | Default CuidState (uses `"node"` envData). |
| `cuid` | `Effect<Cuid, never, CuidState>` | Generate a Cuid. |

---

### Ksuid

| Export | Type | Description |
|--------|------|-------------|
| `Ksuid` | `Schema<string, Ksuid>` | Branded schema for 27-char base62 Ksuids. |
| `Ksuid` (type) | `string` | Branded Ksuid type. |
| `isKsuid` | `(value: string) => value is Ksuid` | Type guard. |
| `ksuid` | `Effect<Ksuid, never, DateTimes \| RandomValues>` | Generate a Ksuid. |

---

### NanoId

| Export | Type | Description |
|--------|------|-------------|
| `NanoId` | `Schema<string, NanoId>` | Branded schema for `[0-9a-zA-Z_-]+` strings. |
| `NanoId` (type) | `string` | Branded NanoId type. |
| `isNanoId` | `(value: string) => value is NanoId` | Type guard. |
| `nanoId` | `Effect<NanoId, never, RandomValues>` | Generate a 21-char NanoId. |

---

### Ulid

| Export | Type | Description |
|--------|------|-------------|
| `Ulid` | `Schema<string, Ulid>` | Branded schema for ULID strings. |
| `Ulid` (type) | `string` | Branded Ulid type. |
| `isUlid` | `(value: string) => value is Ulid` | Type guard. |
| `ulid` | `Effect<Ulid, never, DateTimes \| RandomValues>` | Generate a ULID. |

---

### Uuid4

| Export | Type | Description |
|--------|------|-------------|
| `Uuid4` | `Schema<string, Uuid4>` | Branded schema for UUID v4. |
| `Uuid4` (type) | `string` | Branded Uuid4 type. |
| `isUuid4` | `(value: string) => value is Uuid4` | Type guard. |
| `uuid4` | `Effect<Uuid4, never, RandomValues>` | Generate a UUID v4. |

---

### Uuid5

| Export | Type | Description |
|--------|------|-------------|
| `Uuid5` | `Schema<string, Uuid5>` | Branded schema for UUID v5. |
| `Uuid5` (type) | `string` | Branded Uuid5 type. |
| `Uuid5Namespace` | `Uint8Array` (type) + const object | Namespace type; const has `DNS`, `URL`, `OID`, `X500`. |
| `isUuid5` | `(value: string) => value is Uuid5` | Type guard. |
| `uuid5` | `(name, namespace) => Effect<Uuid5>` or `(namespace) => (name) => Effect<Uuid5>` | Generate UUID v5 from name + namespace. |
| `dnsUuid5`, `urlUuid5`, `oidUuid5`, `x500Uuid5` | `(name: string) => Effect<Uuid5>` | Pre-bound effects for standard namespaces. |

---

### Uuid7

| Export | Type | Description |
|--------|------|-------------|
| `Uuid7` | `Schema<string, Uuid7>` | Branded schema for UUID v7. |
| `Uuid7` (type) | `string` | Branded Uuid7 type. |
| `isUuid7` | `(value: string) => value is Uuid7` | Type guard. |
| `Uuid7State` | Service | Provides `next: Effect<Uuid7Seed>`. Used by `uuid7`. |
| `Uuid7State.Default` | `Layer<Uuid7State>` | Default Uuid7State. |
| `uuid7` | `Effect<Uuid7, never, Uuid7State>` | Generate a UUID v7. |

---

### DateTimes

| Export | Type | Description |
|--------|------|-------------|
| `DateTimes` | Service | Provides `now: Effect<number>`, `date: Effect<Date>`. |
| `DateTimes.now` | `Effect<number, never, DateTimes>` | Current time in ms. |
| `DateTimes.date` | `Effect<Date, never, DateTimes>` | Current date. |
| `DateTimes.Default` | `Layer<DateTimes>` | Real clock. |
| `DateTimes.Fixed(baseDate)` | `Layer<DateTimes>` | Fixed time for tests; `baseDate` is `number \| string \| Date`. |

---

### RandomValues

| Export | Type | Description |
|--------|------|-------------|
| `RandomValues` | Service | Provides a function `(length) => Effect<Uint8Array>`. |
| `RandomValues.call(length)` | `Effect<Uint8Array, never, RandomValues>` | Request `length` cryptographically random bytes. |
| `RandomValues.Default` | `Layer<RandomValues>` | Uses `crypto.getRandomValues`. |
| `RandomValues.Random` | `Layer<RandomValues>` | Uses Effect `Random` (e.g. for tests). |
