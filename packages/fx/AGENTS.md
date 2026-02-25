# @typed/fx

## Intent

`@typed/fx` provides a full-featured reactive programming layer for Effect: streams (Fx), mutable reactive state (RefSubject), push-based flows (Push), multicast (Subject), consumers (Sink), and versioned values (Versioned). Use it when you need event streams, reactive UI state, or composing Effects as observable streams instead of one-shot computations.

## Capabilities and purpose

- **Fx** — Effect-native stream type with rich combinators (`map`, `flatMap`, `switchMap`, `merge`, etc.) and run functions (`observe`, `collect`, `fork`). Integrates with Effect's `E` (typed errors), `R` (context), and interruption. Use for event buses, async sequences, periodic updates, or any value-over-time flow.
- **RefSubject** — Mutable reactive refs: observable state that can be read (Effect), updated, and subscribed to (Fx). Typed variants (`RefArray`, `RefBoolean`, `RefOption`, etc.) provide domain-specific helpers. Use for reactive UI state, form state, or shared mutable state that components subscribe to.
- **Subject** — Multicast point: one source Fx, many subscribers. Use with `Subject.share`, `Subject.hold`, or `Subject.replay` when multiple consumers need the same stream without re-running it.
- **Push** — Push-based abstraction (Sink + Fx): consume values and produce output. Use for backpressure or request/response flows.
- **Sink** — Consumer abstraction for Fx output; compose via `map`, `filter`, `loop`, `withState`, etc.
- **Versioned** — Time-varying value with a version number; both subscribable (Fx) and sampleable (Effect). Use when you need "current value + change stream" semantics.
- **Stream interop** — `Fx.toStream` / `Fx.fromStream` for Effect `Stream` integration.

## Key exports / surfaces

- `Fx`, `Push`, `RefSubject`, `Subject`, `Sink`, `Versioned`
- Typed refs: `RefArray`, `RefBoolean`, `RefOption`, `RefString`, `RefDuration`, `RefHashMap`, etc.
- Dependencies: `effect`

## Constraints

- Effect skill loading: `.cursor/rules/effect-skill-loading.mdc`
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`
- Large API surface: see README for full API; keep AGENTS.md navigational only

## Pointers

- README for complete API reference and examples
- `examples/counter` for a full runnable app using RefSubject/Fx
- Root AGENTS.md for bootup/modes
