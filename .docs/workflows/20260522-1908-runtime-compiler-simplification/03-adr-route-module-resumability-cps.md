## Status

accepted

## Context

Typed wants route modules to be resumable in the Qwik sense: route behavior should be pauseable and resumable without replaying the entire route module or preserving hidden heap state.

The current compiler already has a small CPS planning scaffold and closure-context planning scaffold, but they do not yet define the route-module transform. Current HMR support focuses on `RefSubject` state reuse. That is necessary but insufficient for resumability because closures also capture dependencies, values, services, and template-related behavior.

## Decision

Route-module resumability will be implemented through CPS-style closure lowering.

The compiler will analyze every compiler-visible route-module closure and either:

- lower it into an explicit continuation descriptor with generated symbol identity, Effect `Context` capture records, `RefSubject.Service` state identities, dependency fingerprints, and compatibility fingerprints; or
- reject it with structured diagnostics when captures are not safe to resume.

Typed will not adopt Qwik's QRL wire format. The Typed equivalent is a virtual-module continuation descriptor that can be emitted into generated modules, artifact manifests, and Vite HMR runtime glue.

## Consequences

Positive:

- HMR state preservation and route resumability share one compiler model.
- Closure captures become explicit typed inputs rather than hidden heap state.
- Effect `Context` and `RefSubject.Service` stay central to Typed's programming model.
- Unsupported captures fail closed with diagnostics.

Trade-offs:

- The route analyzer must move from regex scanning to TypeScript AST/type-checker evidence.
- Some currently valid route-module closure shapes may be rejected until they are rewritten into resumable forms.
- The compiler needs stronger type tests and fixture coverage before this can be considered stable.

## Alternatives considered

1. Preserve only `RefSubject` state during HMR:
   - Rejected because it does not make route closures resumable.
2. Serialize arbitrary closure heap state:
   - Rejected because it is unsound and conflicts with Typed's explicit Effect/service model.
3. Copy Qwik QRLs directly:
   - Rejected because Typed already has virtual-module identities, artifact-store fingerprints, Effect contexts, and service identities that fit the same role better.
4. Defer closure lowering until after template optimization:
   - Rejected after human clarification that closure CPS transformation is the enabling path for HMR improvements.

## References

- `.docs/workflows/20260522-1908-runtime-compiler-simplification/02-research.md`
- `.docs/workflows/20260522-1908-runtime-compiler-simplification/requirements.md`
- `packages/compiler/src/cps/planCpsCompilation.ts`
- `packages/compiler/src/hmr/closureContext.ts`
- `packages/fx/src/RefSubject/RefSubject.ts`
- `packages/app/src/runtime/hmrRegistry.ts`
- `https://qwik.dev/docs/concepts/resumable/`
- `https://qwik.dev/tutorial/qrl/optimizer/`
- `https://qwik.dev/docs/advanced/qrl/`
