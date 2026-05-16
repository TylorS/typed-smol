## Status

accepted

## Context

The HttpApi virtual-module plugin emits TypeScript source that calls unstable Effect HttpApi APIs. Existing durable HttpApi docs reference `effect@4.0.0-beta.4` and include an `OpenApi.fromApi(..., { additionalProperties })` generation option. The installed dependency for `packages/app` is currently `effect@4.0.0-beta.66`, and its local declarations show `OpenApi.fromApi(api)` without an options parameter.

Generated source must compile against the dependency actually installed for `@typed/app`. Online docs and older durable specs can guide intent, but local installed declarations are the precise contract that TypeScript will check.

## Decision

For this hardening tranche, treat `packages/app/node_modules/effect/dist/unstable/httpapi/*.d.ts` as the source of truth for HttpApi generated-source compatibility.

Implementation must:

- emit only installed Effect HttpApi APIs;
- type-check emitted source against the installed declarations in `packages/app` fixtures;
- defer or diagnose stale durable spec items that are not present in the installed declarations;
- avoid casts or guessed API shapes to preserve older intended behavior.

This supersedes the stale parts of `.docs/adrs/20260223-0043-httpapi-virtual-module-filesystem-contract.md` where they conflict with the installed Effect API surface.

## Consequences

Positive:

- Generated source correctness is grounded in the actual package dependency.
- Effect unstable API drift is detected through fixture type-checking instead of later user failures.
- Future Effect upgrades have an explicit place to update generated-source compatibility.

Trade-offs:

- Some durable HttpApi spec items must be updated or deferred.
- Generated behavior may temporarily lag broader product intent until the installed Effect API supports it or the dependency is upgraded.
- The emitter needs helper boundaries so Effect API drift can be localized.

## Alternatives considered

1. Implement older durable spec items with casts.
   - Rejected: hides API drift and weakens generated-source type-check proof.
2. Use online docs as the source of truth.
   - Rejected: online docs can differ from the installed workspace dependency.
3. Upgrade Effect as part of this tranche.
   - Deferred: this tranche is about hardening Router/HttpApi implementation against the current workspace state, not broad dependency migration.

## References

- `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/02-research.md`
- `.docs/workflows/20260516-0957-router-httpapi-implementation-hardening/requirements.md`
- `packages/app/node_modules/effect/dist/unstable/httpapi/HttpApiBuilder.d.ts`
- `packages/app/node_modules/effect/dist/unstable/httpapi/HttpApiEndpoint.d.ts`
- `packages/app/node_modules/effect/dist/unstable/httpapi/HttpApiGroup.d.ts`
- `packages/app/node_modules/effect/dist/unstable/httpapi/OpenApi.d.ts`
- `packages/app/node_modules/effect/dist/unstable/httpapi/HttpApiScalar.d.ts`
- `packages/app/node_modules/effect/dist/unstable/httpapi/HttpApiSwagger.d.ts`
- `.docs/adrs/20260223-0043-httpapi-virtual-module-filesystem-contract.md`
