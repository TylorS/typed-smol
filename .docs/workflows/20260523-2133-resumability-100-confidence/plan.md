# Plan

1. Add failing runtime tests for route resume registry, schema-backed decode, generated service provision, and resume trigger boot.
2. Implement minimal `@typed/app/resumability` registry/runtime APIs and wire `@typed/template` boot helpers to them.
3. Add failing compiler transform tests for generated registration exports, descriptor/provider metadata, no positional arrays, no unguarded HMR, and syntax coverage.
4. Harden route classifier/transform output to register continuations and fail closed for unsupported TypeScript patterns.
5. Add failing UI tests for first-party action descriptors, DataAttr restore, and WeakMap-not-source-of-truth behavior.
6. Convert first-party UI internals to serializable action metadata where strict resumability requires it.
7. Add shared host diagnostic fixture and coverage matrix generation.
8. Derive component identity from compiler source facts instead of requiring first-party UI to hand-author component ids.
9. Run focused package gates and fix regressions without reverting unrelated work.
