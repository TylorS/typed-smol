# ADR: Typed Framework Remains Virtual-Module First

Status: accepted

## Context

Typed is expanding toward a SvelteKit/Next.js-style framework experience, but its core advantage is explicit, composable virtual-module code generation. Existing router and HttpApi plugins already generate typed surfaces through imports such as `router:./routes` and `api:./api`.

The approved framework starter scope explicitly rejects actual filesystem routing. A filesystem router would make the framework own route discovery and control flow, weakening composability and increasing inversion of control.

## Decision

Typed framework features shall remain virtual-module based.

- Route, HttpApi, env, config, and future framework-generated surfaces are imported explicitly.
- The starter may use conventions to keep setup minimal, but those conventions feed virtual modules rather than a framework-owned route tree.
- This tranche shall not introduce actual filesystem routing.
- Future app-mode features, including CSR, MPA, SSG, and incremental SSG, must preserve this virtual-module-first architecture.

## Consequences

- Users keep direct control over generated surfaces and composition.
- Framework ergonomics must improve through better virtual modules, starter structure, and helper APIs rather than hidden route ownership.
- Some lower-level import shape may remain visible in v1, but the system stays easier to compose and test.

## Alternatives Considered

- Actual filesystem routing: rejected because it creates inversion of control and conflicts with Typed's virtual-module codegen model.
- App-directory convention layer that generates hidden route imports: deferred unless it can be expressed as composable virtual modules without hiding control flow.

## References

- `.docs/workflows/20260516-1600-typed-framework-starter/intent.md`
- `.docs/workflows/20260516-1600-typed-framework-starter/scope.md`
- `.docs/workflows/20260516-1600-typed-framework-starter/requirements.md`
- `.docs/specs/router-virtual-module-plugin/spec.md`
- `.docs/specs/httpapi-virtual-module-plugin/spec.md`
