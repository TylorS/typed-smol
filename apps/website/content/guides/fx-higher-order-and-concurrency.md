---
title: Flatten Fx with an explicit policy
summary: Choose whether inner Fx overlap, wait, replace one another, or are ignored.
section: Fx
kind: guide
order: 1.4
---

An Fx can start another Fx. The outer Fx decides when work exists; the inner Fx can produce zero,
one, or many values of its own. A flattening operator decides which inner subscriptions are allowed
to run when the outer Fx produces again.

Start with the policy, not the operator name:

| Policy | Operator | What happens to competing work | Output order |
| --- | --- | --- | --- |
| Run every inner | `flatMap` | starts another inner immediately | each inner stays ordered; inners may interleave |
| Run at most *n* inners | `flatMapConcurrently` | waits for a permit | admitted inners may interleave |
| Run one inner at a time | `concatMap` | keeps every value waiting | source order |
| Keep only the current inner | `switchMap` | interrupts it and starts the replacement | only the latest inner continues |
| Ignore arrivals while busy | `exhaustMap` | discards the arrival | active inner only |
| Keep one latest arrival while busy | `exhaustLatestMap` | replaces the waiting value | active inner, then latest waiting inner |
| Select a branch per boolean | `if` | switches to the selected branch | selected branch only |
| First useful competitor wins | `race` | interrupts the other competitor | winner values only |
| First useful candidate wins | `raceAll` | interrupts every other candidate | winner values only |

The six mapping policies start with a callback of the form `(value) => Fx`. `if` selects between
two Fx branches; `race` and `raceAll` receive competitors directly. In every case, each inner Fx
remains a complete reactive process with its own cardinality, failures, services, and lifetime.

## Run every inner with flatMap

Use `flatMap` when the work started by one value is independent of the work started by every other
value. Every inner Fx runs. An inner keeps its own order, but different inners may emit in whichever
order their values become available.

```ts
import { Fx } from "@typed/fx";

const requests = Fx.mergeAll(
  Fx.at("a", "0 millis"),
  Fx.at("b", "5 millis"),
);

const load = (id: string) =>
  Fx.mergeAll(
    Fx.at(`${id}:cached`, "10 millis"),
    Fx.at(`${id}:fresh`, "40 millis"),
  );

const results = requests.pipe(Fx.flatMap(load));
```

```fx-marble
title: flatMap runs every inner and lets their values interleave
covers: flatMap, flatMapEffect
input: a . b . . . . . |
operator: flatMap(load)
inner a: ^ a1 . . a2 | . . .
inner b: . . ^ b1 . b2 | . .
output: . a1 . b1 a2 b2 . . |
```

Each inner lane starts at `^` and ends at `|`: the `a` inner is still active when `b` arrives, so
both remain subscribed. Use this only when
unbounded overlap is acceptable. A fast or unbounded outer Fx can create an unbounded number of
active inners.

## Bound overlap with flatMapConcurrently

`flatMapConcurrently` keeps every source value but admits at most the requested number of inners at
once. Waiting values are not dropped. Once an active inner completes, the next waiting inner gets a
permit.

```ts
import { Fx } from "@typed/fx";

const attachments = Fx.fromIterable(["a", "b", "c"]);

const upload = (file: string) =>
  Fx.mergeAll(
    Fx.succeed(`${file}:opened`),
    Fx.at(`${file}:stored`, "1 second"),
  );

const uploads = attachments.pipe(Fx.flatMapConcurrently(upload, 2));
```

```fx-marble
title: flatMapConcurrently waits when every permit is occupied
covers: flatMapConcurrently, flatMapConcurrentlyEffect
input: a b c . . . . . |
operator: flatMapConcurrently(load, 2)
inner a: ^ a1 . a2 | . . . .
inner b: . ^ b1 . b2 | . . .
inner c: . . . . . ^ c1 c2 |
output: . a1 b1 a2 b2 . c1 c2 |
```

Here `a` and `b` occupy the two permits. The `c` inner does not begin until one of them finishes.
The limit bounds active work, not retained work: waiting inputs still consume memory, so this is not
an implicit backpressure protocol.

The concurrency argument must be a positive safe integer. An invalid value fails through the error
channel with `Cause.IllegalArgumentError`. A valid limit changes admission, not ordering; concurrent
inners may still interleave.

## Preserve every inner in order with concatMap

`concatMap` is the one-at-a-time policy that loses nothing. It waits for the active inner to
complete before starting the next one, so both source order and each inner's local order are visible
in the output.

```ts
import { Fx } from "@typed/fx";

const revisions = Fx.fromIterable(["a", "b", "c"]);

const save = (revision: string) =>
  Fx.mergeAll(
    Fx.succeed(`${revision}:accepted`),
    Fx.at(`${revision}:stored`, "20 millis"),
  );

const auditTrail = revisions.pipe(Fx.concatMap(save));
```

```fx-marble
title: concatMap finishes each inner before starting the next
covers: concatMap, concatMapEffect
input: a b c . . . . . . |
operator: concatMap(save)
inner a: ^ a1 a2 | . . . . . .
inner b: . . . ^ b1 b2 | . . .
inner c: . . . . . . ^ c1 c2 |
output: . a1 a2 . b1 b2 . c1 c2 |
```

Choose `concatMap` for writes, migrations, or protocol steps where starting later work early would
violate the product rule. An infinite inner prevents every later inner from starting; that follows
directly from the sequencing guarantee.

## Replace obsolete inner work with switchMap

`switchMap` keeps one current inner. When a new outer value arrives, it interrupts the previous
inner, waits for that interruption and its finalizers, then starts the replacement. Values already
emitted by the old inner stay emitted; only its future work is cancelled.

```ts
import { Fx } from "@typed/fx";

const drafts = Fx.mergeAll(
  Fx.at("initial", "0 millis"),
  Fx.at("revised", "5 millis"),
);

const preview = (draft: string) =>
  Fx.mergeAll(
    Fx.at(`${draft}:started`, "1 millis"),
    Fx.at(`${draft}:ready`, "20 millis"),
  );

const previews = drafts.pipe(Fx.switchMap(preview));
```

```fx-marble
title: switchMap interrupts the old inner exactly when its replacement arrives
covers: switchMap, switchMapEffect
input: a . b . . . |
operator: switchMap(preview)
inner a: ^ a1 x . . . .
inner b: . . ^ b1 . b2 |
output: . a1 . b1 . b2 |
```

The `x` in the `a` lane shares a time slot with `b`: replacement is the cause of cancellation. `a1` remains because
it arrived before the switch; the later value from the `a` inner never arrives. This is the right
policy for previews, live search, route-driven data, and any result that becomes irrelevant when its
input changes.

## Ignore busy arrivals with exhaustMap

`exhaustMap` admits the first inner while idle and ignores every arrival until that inner completes.
Ignored arrivals are not queued and never run. Once idle again, the next arrival can start a new
inner.

```ts
import { Fx } from "@typed/fx";

const submits = Fx.mergeAll(
  Fx.at("first", "0 millis"),
  Fx.at("ignored", "5 millis"),
  Fx.at("later", "30 millis"),
);

const submit = (command: string) => Fx.at(`saved:${command}`, "20 millis");

const accepted = submits.pipe(Fx.exhaustMap(submit));
```

```fx-marble
title: exhaustMap ignores arrivals until the active inner completes
covers: exhaustMap, exhaustMapEffect
input: a b . . c . . . |
operator: exhaustMap(submit)
inner a: ^ a1 . a2 | . . .
inner c: . . . . ^ c1 . c2 |
output: . a1 . a2 . c1 . c2 |
```

Use this when repetition while busy is meaningless: a double-clicked submit, repeated device
connection requests, or another command whose active execution already represents the user's
intent. If the latest busy arrival must eventually run, use `exhaustLatestMap` instead.

## Retain one latest arrival with exhaustLatestMap

`exhaustLatestMap` also runs one inner at a time, but it keeps one waiting value. Every newer busy
arrival replaces that waiting value. When the active inner completes, only the latest retained value
starts.

```ts
import { Fx } from "@typed/fx";

const versions = Fx.mergeAll(
  Fx.at("v1", "0 millis"),
  Fx.at("v2", "5 millis"),
  Fx.at("v3", "10 millis"),
);

const index = (version: string) => Fx.at(`indexed:${version}`, "20 millis");

const indexed = versions.pipe(Fx.exhaustLatestMap(index));
```

```fx-marble
title: exhaustLatestMap keeps only the newest value waiting behind active work
covers: exhaustLatestMap, exhaustLatestMapEffect
input: a b c . . . . . |
operator: exhaustLatestMap(index)
inner a: ^ a1 . a2 | . . . .
inner c: . . . . . ^ c1 c2 |
output: . a1 . a2 . c1 c2 |
```

While the `a` inner runs, `b` becomes pending and then `c` replaces it. The only inner lanes are `a`
and `c`, because `b` never runs. The active `a` inner is not
cancelled; after it completes, the retained `c` inner runs. This is useful for saves, indexing, and
synchronization where overlap is forbidden but the system must eventually reflect the newest state.

## Select a branch with if

`if` turns each boolean condition value into a selected Fx branch. A newer condition switches to its
branch, interrupting the previously selected one just as `switchMap` does.

```fx-marble
title: if switches from the true branch to the false branch
covers: if
input condition: true . false . |
operator: if(condition, { onTrue, onFalse })
inner onTrue: ^ enabled x . .
inner onFalse: . . ^ disabled |
output: . enabled . disabled |
```

The `onTrue` lane is cancelled when `false` arrives. The `onFalse` lane becomes the winner only for
that condition value; source completion waits for its selected branch to finish.

## Let the first useful competitor win with race

`race` starts both inputs together. Completion or failure without a value does not win; the first
value selects its producer, interrupts the loser, and the selected producer continues to determine
the output.

```fx-marble
title: race cancels slow once fast emits first
covers: race
input competitors: slow+fast . . |
operator: race(slow, fast)
inner slow: ^ x . .
inner fast: ^ fast |
output: . fast |
```

Here `fast` emits first, so the `slow` lane receives `x`. The winner's value and completion are the
output's value and completion.

## Race a runtime-sized set with raceAll

`raceAll` applies the same first-value rule to every provided Fx. It starts all candidates and
interrupts every loser as soon as one candidate emits.

```fx-marble
title: raceAll keeps fast and cancels the other candidates
covers: raceAll
input candidates: slow+fast+mid . . |
operator: raceAll(slow, fast, mid)
inner slow: ^ x . .
inner fast: ^ fast |
inner mid: ^ x . .
output: . fast |
```

`fast` is the only producer whose value and completion reach the output; both other candidates are
interrupted at the selection slot.

## Effect-returning convenience variants

Use the Fx-returning operators above as the primary vocabulary. When a callback naturally returns
one `Effect` result, the corresponding `*Effect` operator performs the `Fx.fromEffect` conversion
for you without changing the admission policy.

| Fx callback | Effect callback | Shared policy |
| --- | --- | --- |
| `flatMap` | `flatMapEffect` | run every inner concurrently |
| `flatMapConcurrently` | `flatMapConcurrentlyEffect` | run at most *n* inners |
| `concatMap` | `concatMapEffect` | run every inner sequentially |
| `switchMap` | `switchMapEffect` | interrupt the old inner for the latest |
| `exhaustMap` | `exhaustMapEffect` | ignore arrivals while busy |
| `exhaustLatestMap` | `exhaustLatestMapEffect` | retain one latest waiting value |

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

type Revision = { readonly id: string };

const save = Effect.fn(function* (revision: Revision) {
  yield* Effect.log(`saving ${revision.id}`);
  return revision.id;
});

const revisions = Fx.fromIterable<Revision>([{ id: "a" }, { id: "b" }]);

const explicit = revisions.pipe(
  Fx.concatMap((revision) => Fx.fromEffect(save(revision))),
);

const convenient = revisions.pipe(Fx.concatMapEffect(save));
```

`explicit` and `convenient` have the same sequencing behavior. The cardinality is narrower than an
arbitrary inner Fx: each admitted Effect can produce one successful value, fail, or be interrupted.
Its typed error and service requirements still compose into the returned Fx.

## Errors, services, and lifetime remain visible

Every flattening policy unions the outer and inner error channels and service requirements. The
returned Fx also requires `Scope`, which owns admitted inner subscriptions, waiting work, and
interruption. Source completion waits for every inner the selected policy promises to finish.

That common type behavior does not erase the policy differences above. `concatMap` promises to
drain every waiting inner; `switchMap` promises to interrupt obsolete work; `exhaustMap` promises
that busy arrivals will not run. Choose the behavioral contract first, then provide services and
own the subscription at the application boundary. Continue with
[Fx services and lifetime](/explore/fx-services-and-lifetime) for those ownership boundaries and
[Consuming Fx](/explore/consuming-fx) for runners.
