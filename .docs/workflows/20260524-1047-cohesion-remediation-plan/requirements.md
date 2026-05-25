# Requirements

## Functional Requirements

- FR-1: `MountOptions` must accept an optional compiled DOM runtime object and pass it to `CompiledDomTemplate.renderInto`.
- FR-2: The app browser runtime must build one `DomTemplateRuntime` from default route/action resume registries and optional devtools config.
- FR-3: Compiled templates with event action descriptors must attach action resume listeners during browser hydration.
- FR-4: Browser virtual modules must hydrate with the app-owned DOM runtime helper.
- FR-5: Devtools-enabled browser runtime must install `globalThis.__TYPED_DEVTOOLS__.resolveSelectedElement`.
- FR-6: Devtools-disabled browser runtime must leave the global bridge absent or explicitly unbound.
- FR-7: Storybook RealWorld builds must keep consuming `typed:storybook/runtime?path=/` and runtime defaults.
- FR-8: `packages/ui/AGENTS.md` must describe the headless component-library surface currently documented in the README.
- FR-9: Developer-tooling-owned changes must wait for handoff from the active developer-tooling agent.
- FR-10: RealWorld must pass the full local functional/compliance gate: `check`, `build`, `test`, `test:acceptance:local`, `test:hmr:local`, and `storybook:build`.
- FR-11: RealWorld must prove route resumability and action resumability through the real generated browser runtime, not through isolated unit tests alone.
- FR-12: RealWorld routes and UI action handlers must fail closed when something is not resumable; final verification must have no known non-resumable app path.
- FR-13: Any browser externalization or virtual-id warning that affects RealWorld runtime correctness is a blocker, even if it belongs to the developer-tooling workflow.
- FR-14: Remediation work must conform to `.docs/adrs/20260524-runtime-cohesion-ownership-boundaries.md`.
- FR-15: Any proposed change that introduces a second owner for browser runtime handoff, route/action resume runtime, DevTools bridge installation, Storybook app runtime behavior, or virtual-module host integration must be rejected or moved behind a new approved ADR.

## Non-Functional Requirements

- NFR-1: Keep virtual-modules-only architecture; do not add filesystem routing or local typed-module shims.
- NFR-2: Keep Storybook as a consumer of app/runtime virtual modules.
- NFR-3: Keep broad public `unknown` channels out of Storybook and app public helpers unless the runtime boundary truly requires them.
- NFR-4: Prefer focused tests that fail before implementation.
- NFR-5: Keep changes narrow and commit per coherent subgoal during execution.
- NFR-6: Do not revert or absorb another agent's work.
- NFR-7: Document developer-tooling handoff status before touching tooling-owned files.
- NFR-8: Do not claim RealWorld is compliant unless the upstream local acceptance runner passes.
- NFR-9: Do not claim 100% resumability unless the generated app path and RealWorld fixture prove it with executable tests.
- NFR-10: Preserve DRY, SOLID, and YAGNI as testable architecture constraints: one owner per responsibility, no duplicate runtime paths, and no abstraction without a failing gate that requires it.

## Open Coordination Point

The null-byte virtual id warning and browser externalization warnings may overlap with the active developer-tooling workflow. They are handoff-gated for ownership, but they are not optional for release readiness if they affect RealWorld compliance or resumability.
