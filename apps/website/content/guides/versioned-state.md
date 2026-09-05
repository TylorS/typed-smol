---
title: "Working with Versioned state"
summary: "Keep a current read, update stream, and invalidation token together when a value comes from an independently owned source."
section: "State"
kind: "guide"
order: 2.22
---

`Versioned` is the public contract for state supplied by another owner. It combines three related,
but independently typed, channels:

- `version`: an Effect that reads a numeric invalidation token;
- the `Fx` itself: updates that observers receive over time;
- the Effect itself: the current value when a consumer reads it.

Use it when a cache, transport, external store, or library must expose all three capabilities
without choosing how the producer writes. `RefSubject` is the higher-level choice for ordinary
writable application state; it implements the same read-and-observe shape while also defining
state transitions.

## Construct the three channels deliberately

`Versioned.make(version, updates, current)` keeps the channels together but does not synchronize
them for you. The version is whatever the supplied Effect returns: `Versioned` does not increment
it, require it to be monotonic, or prove that it and a current read are one atomic snapshot. Its
producer defines what a changed token invalidates and coordinates current values with publications.

```ts
import { Effect } from "effect";
import * as Fx from "@typed/fx/Fx";
import * as Versioned from "@typed/fx/Versioned";

const status = Versioned.make(
  Effect.succeed(7),
  Fx.succeed("ready"),
  Effect.succeed({ state: "ready" as const, checkedAt: 7 }),
);

const readStatus = Effect.gen(function* () {
  return {
    version: yield* status.version,
    current: yield* status,
    updates: yield* Fx.collectAll(status),
  };
});

await Effect.runPromise(readStatus);
```

The update and current channels may intentionally have different value types, as they do above.
They also keep separate errors and service requirements. A consumer reading `status` sees only the
current-read Effect's error and services; a consumer observing `status` sees the Fx channel's;
`status.version` has its own pair.

`Versioned.of(value)` is the small constant constructor: it supplies version `1`, one update, and
that same current value. It is useful for composition and focused tests, not as a mutable store.

## Read now, observe later, and let the producer own writes

A `Versioned` value does not define a write operation. The producer that owns its backing data
must decide how a write updates the current-value Effect, emits an Fx update, and changes the
version token. That boundary is useful: consumers can receive the state capability without gaining
permission to mutate the source.

Run a current read like any other Effect. To observe a long-lived update channel, run an Fx
operation such as `Fx.observe` in the consumer's Scope. `Fx.collectAll` is appropriate only for a
finite source, as in the example above. Reading the current value shares in-flight work among
concurrent readers; `interrupt` stops that shared current-read work, but does not complete or take
ownership of the independently supplied update channel.

For practical cache work, treat `version` as an invalidation key attached to a read, then recheck
before committing a result when updates may race the work. Do not infer a transaction from two
separate Effects just because they are exposed by one `Versioned` value.

```ts
import { Effect } from "effect";
import * as Versioned from "@typed/fx/Versioned";

const profile = Versioned.of({ id: "u-42", name: "Ada" });

const cacheInput = Effect.gen(function* () {
  const version = yield* profile.version;
  const value = yield* profile;
  return { version, value };
});

await Effect.runPromise(cacheInput);
```

The producer chooses whether one version represents one value, a refreshed remote snapshot, or a
larger batch of invalidated work. That is the contract callers should document and test.

## Preserve errors, services, and lifetime

The public type has one environment/error pair for each channel:

```text
Versioned<RVersion, EVersion, AUpdate, EUpdate, RUpdate, ACurrent, ECurrent, RCurrent>
```

This prevents an update-stream failure from being silently treated as a failed current read. When
one Layer should satisfy all three channels, use `Versioned.provide(versioned, layer)`. It applies
the Layer consistently to version reads, updates, and current reads.

`Versioned` itself performs no acquisition. `Versioned.hold`, `Versioned.multicast`, and
`Versioned.replay` add a scoped shared update subscription; the Scope that runs them owns that
subscription and any replay buffer. Keep that Scope with the feature, request, or test that owns
the shared observation.

For a Context dependency, `Versioned.Service` creates a normal Effect service facade and a Layer
constructor. Consumers retain the same three operations through the service tag.

```ts
import { Effect } from "effect";
import * as Fx from "@typed/fx/Fx";
import * as Versioned from "@typed/fx/Versioned";

class Status extends Versioned.Service<Status, never, string, never, string>()("example/Status") {}

const StatusLive = Status.make(
  Effect.succeed(1),
  Fx.succeed("ready"),
  Effect.succeed("ready"),
);

const program = Effect.gen(function* () {
  return {
    value: yield* Status,
    version: yield* Status.version,
    updates: yield* Fx.collectAll(Status),
  };
}).pipe(Effect.provide(StatusLive), Effect.scoped);

await Effect.runPromise(program);
```

## Test the contract directly

No application shell is needed to test a `Versioned` contract. Construct a finite value, run the
three channels, and assert the producer's promised relation between them. Separately test failures,
required services, and scoped sharing when the concrete producer uses those features.

```ts
import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as Fx from "@typed/fx/Fx";
import * as Versioned from "@typed/fx/Versioned";

describe("profile Versioned contract", () => {
  it("exposes the producer's current value, updates, and invalidation token", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const profile = Versioned.make(
          Effect.succeed(3),
          Fx.succeed("Ada"),
          Effect.succeed({ name: "Ada" }),
        );

        return {
          version: yield* profile.version,
          current: yield* profile,
          updates: yield* Fx.collectAll(profile),
        };
      }),
    );

    expect(result).toEqual({
      version: 3,
      current: { name: "Ada" },
      updates: ["Ada"],
    });
  });
});
```

This style checks the public Effect and Fx behavior that a consumer actually receives. Add a
scoped observation test when sharing, replay, interruption, or a live producer is part of the
contract.
