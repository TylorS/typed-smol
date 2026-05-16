# Intent — Router and HttpApi Implementation Hardening

Status: draft, not approved.

## Problem

The Router and HttpApi virtual-module plugins in `@typed/app` are now important framework surfaces rather than experiments. They generate source that downstream users, Vite, vmc, the TypeScript plugin, and editor tooling must all trust. The next tranche should harden their implementation, not merely expand the tests around current behavior.

The highest-risk area is generated-source correctness: the plugins must emit deterministic, type-checking, semantically correct TypeScript for Router matcher assembly and Effect HttpApi assembly across nested directories, companion conventions, path handling, handler modes, and OpenAPI/build wiring.

## Desired Outcome

Make the Router and HttpApi virtual-module implementations production-ready enough to serve as the next framework substrate after the shared virtual artifact store work.

The intended end state is:

- Router generated source preserves matcher semantics for route ordering, companion precedence, guard/dependency/layout/catch composition, entrypoint normalization, and deterministic imports.
- HttpApi generated source preserves Effect HttpApi semantics for API/group/endpoint assembly, handler wiring, raw-vs-normal handlers, prefixes, OpenAPI exposure, client/layer exports, and deterministic imports.
- Invalid plugin inputs, unsupported conventions, missing TypeInfo targets, and stale API assumptions produce structured diagnostics rather than host crashes or silent warnings.
- Tests prove the hardened implementation behavior, with emphasis on generated-source fixtures, type-checking, and deterministic output rather than coverage-only assertions.
- The work stays aligned with the existing durable Router and HttpApi specs unless research finds those specs are stale and need explicit updates.

## Product Thesis

Typed should feel like a framework where virtual modules are a dependable compiler surface. Router and HttpApi imports should be boring to consume: generated code should type-check, preserve declared conventions, fail clearly when the source tree is invalid, and remain stable across local dev, CI, and editor workflows.

## Priority Biases

- Generated-source correctness first.
- Evidence from emitted code, type-checking, and behavior before claims.
- Structured diagnostics over throws, warnings-only behavior, or silent convention loss.
- Deterministic ordering and path handling across platforms.
- Keep implementation hardening scoped to Router and HttpApi plugin surfaces; avoid unrelated framework features.
- Prefer small helper boundaries that make parse, normalize, validate, and render phases testable.

## Open Questions

- Which generated-source scenarios currently diverge from the durable Router and HttpApi specs.
- Whether current HttpApi generation still matches the installed Effect unstable HttpApi APIs exactly.
- Whether unsupported HttpApi reserved-role diagnostics should be hard errors in this tranche instead of warnings.
- Whether the Router renderer has remaining host-crashing internal invariant paths that should become build diagnostics.
- Which fixture/type-check harness gives the best proof without overbuilding a full sample app.

## Decisions

- Mode is `strict`.
- Finalization strategy is `pr`.
- The workflow is a full production pass across Router and HttpApi implementation hardening.
- Generated-source correctness is the primary focus.
- Test expansion is evidence for implementation hardening, not the primary deliverable.
- The current `@typed/app` focused test suite passes before this tranche begins: 9 files, 205 tests, no type errors.
