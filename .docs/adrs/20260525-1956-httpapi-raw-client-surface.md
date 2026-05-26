# ADR: HttpApi Virtual Modules Expose Raw Effect Client Surface

Status: proposed

## Context

The current generated HttpApi client path still contains `TypedClient`-style wrappers. These wrappers provide no clear advantage over the raw Effect `HttpApiClient`-derived client and can erase generic endpoint function parameters, errors, and service channels. The approved release-slice requirements explicitly reject this abstraction.

## Decision

Client-mode HttpApi virtual modules expose the raw Effect client surface:

- `Api`
- `Client`
- `makeClient`
- `makeClientWith`
- direct raw helper types required to preserve `HttpApiClient.ForApi<typeof Api, E, R>`

They do not expose `TypedClient`, `TypedClientInput`, `TypedRawClient`, `makeTypedClient`, `makeTypedClientWith`, `makeTypedClientFromRaw`, `OptionalEndpoint`, or mapped endpoint wrappers.

Generated source type-checks against the installed Effect HttpApi declarations used by `@typed/app`.

## Consequences

- Endpoint request, success, error, and service-channel inference stays aligned with Effect.
- RealWorld and Storybook consume one client model.
- Older generated artifacts must be regenerated or fail scans if stale wrapper names remain.
- Any future ergonomic helper must prove it preserves the exact raw client generic behavior before being considered.

## Alternatives Considered

1. Keep thin `TypedClient` aliases.
   - Rejected because aliases still create pressure for generic-erasing wrapper mappings.
2. Keep wrappers only in Storybook.
   - Rejected because Storybook must exercise the same generated client contract as app surfaces.
3. Use casts to preserve the wrapper shape.
   - Rejected because type-safety is a release blocker.

## References

- `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/requirements.md`
- `.docs/specs/httpapi-virtual-module-plugin/spec.md`
- `.docs/adrs/20260516-1318-httpapi-generated-source-effect-source-of-truth.md`
