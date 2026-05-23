# Requirements — Storybook Framework Integration

Status: approved on 2026-05-22.

## Functional Requirements

- FR-1: Provide a first-party Storybook framework package for Typed, expected to publish as `@typed/storybook` unless renamed during specification.
- FR-2: The package must expose Storybook-compatible framework, preset, preview, renderer, type, and portable-story testing entrypoints.
- FR-3: The framework preset must compose Storybook's Vite builder with `@typed/vite-plugin` so Typed virtual modules resolve in stories, preview code, and portable tests.
- FR-4: The renderer must support simple Typed component/template stories without requiring server, route, or HttpApi setup.
- FR-5: The framework must provide a server-aware story capability that can run UI interactions against real Typed server-side code through at least one of: app layers, route handlers, SSR routes, or HttpApi handlers.
- FR-6: The framework must support story-level Typed app context, including router state, navigation state, app layers, request URL/context, config, and env values where relevant.
- FR-7: The framework must support portable story execution with Storybook's current `composeStories`, `composeStory`, `setProjectAnnotations`, and story `run()` model.
- FR-8: The framework must preserve Typed's virtual-module-first architecture. Story fixtures must use framework/compiler support for `typed:*` modules rather than local module declarations.
- FR-9: The framework must define a typed author-facing API for server-backed stories, such as decorators, loaders, fixtures, or Typed-specific CSF helpers.
- FR-10: The first implementation tranche must include one fixture story that proves UI plus server-side Typed code can be tested together.
- FR-11: The design must explicitly compare three server execution models before implementation: in-memory runtime harness, Storybook dev-server middleware, and real local Typed HTTP server.
- FR-12: The design must document what is kept, replaced, or discarded from the old `@typed/storybook` implementation.

## Non-Functional Requirements

- NFR-1: The integration must favor inference and type safety over casts, local wrapper types, or duplicated story-only contracts.
- NFR-2: Framework-facing Effect error and service channels must remain explicit where practical; broad `unknown` error/service surfaces are not acceptable as the planned public boundary.
- NFR-3: The first tranche must be narrow enough to deliver and verify one vertical server-backed workflow before broad addon polish.
- NFR-4: Story execution must be deterministic enough for CI and portable tests.
- NFR-5: The framework must not make Storybook own Typed routing or introduce hidden filesystem routing.
- NFR-6: The framework must remain compatible with Typed's current Vite and virtual-module architecture.
- NFR-7: The design must distinguish development-only capabilities from static Storybook build capabilities.
- NFR-8: Requirements and later plan tasks must preserve traceability from requirement IDs to acceptance criteria and tests.

## Acceptance Criteria

- AC-1: A requirements/spec review identifies the target Storybook package exports and maps each export to Storybook's framework-package expectations. Maps to FR-1, FR-2.
- AC-2: A proposed Vite integration path shows where `typedVitePlugin()` is installed and how Storybook `viteFinal` user customization remains possible. Maps to FR-3, NFR-6.
- AC-3: A minimal component/template story can be described without route/server setup in the first tranche plan. Maps to FR-4.
- AC-4: A server-backed fixture story is specified that exercises UI interaction and real Typed server-side code in the same testable story. Maps to FR-5, FR-10, NFR-3.
- AC-5: The requirements/specification choose or defer with evidence among in-memory harness, Storybook middleware, and real local server execution. Maps to FR-11, NFR-4, NFR-7.
- AC-6: Portable story testing is included in the plan with `setProjectAnnotations`, `composeStories` or `composeStory`, and `run()` coverage. Maps to FR-7, NFR-4.
- AC-7: The fixture strategy contains no local `declare module "typed:*"` shims and relies on Typed compiler/framework support. Maps to FR-8, NFR-1, NFR-5.
- AC-8: The author-facing server-story API is specified with typed inputs and expected layer/request/router behavior. Maps to FR-6, FR-9, NFR-1, NFR-2.
- AC-9: The old `@typed/storybook` package is audited in the specification with keep/replace/discard decisions. Maps to FR-12.
- AC-10: The final implementation plan includes at least one focused verification command for package tests and one fixture/portable-story test command. Maps to FR-10, NFR-4, NFR-8.

## Prioritization

- must_have:
  - FR-1 through FR-8
  - FR-10 through FR-12
  - NFR-1 through NFR-8
  - AC-1 through AC-10
- should_have:
  - FR-9
  - A RealWorld follow-up fixture after a smaller first fixture proves the architecture.
- could_have:
  - Visual regression integration.
  - Storybook addon panels for Typed layers, routes, or HttpApi metadata.
  - Static Storybook build support for pre-rendered server-backed stories.
