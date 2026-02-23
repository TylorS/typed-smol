## Effect Parity Matrix (Current Run)

### Scope

- `packages/fx/src/Fx`
- `packages/fx/src/Sink`
- `packages/fx/src/Push`
- `packages/fx/src/RefSubject`
- `packages/fx/src/Versioned`

### Decision Status Legend

- `present`: already existed before this run
- `added`: implemented in this run
- `deferred`: intentionally postponed (higher ambiguity or complexity)
- `n/a`: not applicable to current architecture

## Fx Parity Snapshot

| family          | combinator                      | status | notes                                     |
| --------------- | ------------------------------- | ------ | ----------------------------------------- |
| slice/take/skip | `takeEffect`                    | added  | effectful count variant                   |
| slice/take/skip | `skipEffect`                    | added  | effectful count variant                   |
| slice/take/skip | `sliceEffect`                   | added  | effectful bounds                          |
| slice/take/skip | `takeUntilEffect`               | added  | effectful stop predicate                  |
| slice/take/skip | `takeWhile`                     | added  | take while predicate                      |
| slice/take/skip | `takeWhileEffect`               | added  | effectful predicate                       |
| slice/take/skip | `skipWhile`                     | added  | skip while predicate                      |
| slice/take/skip | `skipWhileEffect`               | added  | effectful predicate                       |
| slice/take/skip | `dropWhile` / `dropWhileEffect` | added  | aliases for Effect naming parity          |
| mapping         | `mapError`                      | added  | maps typed fail channel (Cause.fail path) |
| mapping         | `mapBoth`                       | added  | maps success + typed fail channel         |
| zip/merge       | `zip` / `zipWith`               | added  | lockstep zip                              |
| zip/merge       | `zipLatest` / `zipLatestWith`   | added  | latest semantics via tuple/map            |
| zip/merge       | `merge`                         | added  | binary merge wrapper                      |
| zip/merge       | `concat`                        | added  | sequential composition wrapper            |
| accumulation    | `scan`                          | added  | emits initial + running state             |
| accumulation    | `scanEffect`                    | added  | effectful running state                   |
| error handling  | `catchIf`                       | added  | conditional fail recovery                 |
| error handling  | `catchCauseIf`                  | added  | conditional cause recovery                |
| error handling  | `catchTags`                     | added  | multi-tag handler map                     |
| context         | `provideService`                | added  | service-level provide                     |
| context         | `provideServiceEffect`          | added  | effectful service provide                 |
| conversions     | `result`                        | added  | materialize success/failure as Result     |
| dedupe          | `changesWithEffect`             | added  | effectful repeat suppression              |

## Sink/Push/RefSubject/Versioned Snapshot

| module       | highlights                                                                                              | status |
| ------------ | ------------------------------------------------------------------------------------------------------- | ------ |
| `Sink`       | added `mapError`, `mapInput`, `mapInputEffect`, `flatMap`; major reducing/folding parity still deferred | mixed  |
| `Push`       | added `mapError`, `mapBoth`; mapAccum-style families still deferred                                     | mixed  |
| `RefSubject` | added `fromOption`, `fromNullable`, `getOrElse` parity helpers                                          | added  |
| `Versioned`  | added `filterMap`, `filterMapEffect`                                                                    | added  |

## Deferred Candidates (Next Waves)

- Fx: `zipLeft`, `zipRight`, additional merge variants, timing/control (`debounce`, `throttle`, `timeout`), grouping/partitioning families.
- Sink: reducing/folding/query families (`reduce*`, `fold*`, `head`/`last`/`collect`, recovery variants).
- Push: `mapAccum`, `mapAccumEffect`, `mapArray`, `mapArrayEffect`.
- Fx: broader Tier 2 timing/grouping/partitioning families.

## Notes

- This run prioritized **Tier 1 additive parity** on `Fx` plus non-breaking guarantees.
- Existing public APIs were preserved; additions are incremental and test-backed.
