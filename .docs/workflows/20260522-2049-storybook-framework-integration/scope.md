# Scope — Storybook Framework Integration

Status: approved on 2026-05-22.

## In Scope

### Storybook Framework Package

- Define the target package shape for a first-party Typed Storybook integration.
- Cover Storybook framework exports, preset exports, preview annotations, renderer types, `renderToCanvas`, `viteFinal`, and portable story testing entrypoints.
- Decide how the package composes Storybook's Vite builder with `@typed/vite-plugin`.
- Preserve compatibility with Storybook's framework-package expectations rather than only exposing a renderer package.

### Typed Runtime Integration

- Reuse current Typed app surfaces where possible:
  - `typed:server`
  - `typed:browser`
  - `typed:config`
  - router virtual modules
  - HttpApi virtual modules
  - `TypedHttpServer`
  - `@typed/app/runtime`
  - `@typed/template`
  - `@typed/ui`
  - `@typed/vite-plugin`
- Define how stories receive router state, navigation state, app layers, config/env values, request context, and server-rendered HTML.
- Define how server-side failures are surfaced in Storybook and portable tests with typed Effect error channels where possible.

### Server-Side Story Capability

- Plan support for stories that exercise server-side logic instead of mocking everything at component props.
- Evaluate at least three execution models:
  - in-memory server/runtime harness
  - Storybook dev-server middleware integration
  - real local Typed HTTP server integration
- Include SSR route stories, HttpApi-backed interaction stories, form/workflow stories, and route-handler stories in the requirements discussion.

### Testing And Acceptance

- Define acceptance criteria for component rendering, route rendering, SSR rendering, server-backed interaction tests, and portable story tests.
- Prefer property or generative tests for pure runtime/config mapping where practical.
- Include at least one end-to-end fixture that proves client UI and server-side code can be tested together.

### Documentation And Migration

- Compare against the old `@typed/storybook` implementation and explicitly identify what is kept, replaced, or discarded.
- Define the author-facing story API and minimal setup expected in `.storybook/main.ts` and preview files.
- Document how this integrates with existing Typed app projects and `typed create` output.

## Out Of Scope For Phase 1

- Writing implementation code.
- Installing Storybook packages or changing the lockfile.
- Committing until Phase 1 docs are explicitly approved.
- Designing a broad visual regression service.
- Building hosting/deployment adapters.
- Reworking `@typed/ui` component APIs except where needed to describe Storybook acceptance fixtures.
- Replacing the current Typed router, HttpApi, Vite, or virtual-module architecture.

## Initial Workstreams

1. Storybook API research: current framework package, Vite builder, portable stories, test runner, and meta-framework precedent.
2. Old implementation audit: renderer lifecycle, type surface, Storybook 8 assumptions, and reusable ideas.
3. Typed runtime audit: server/browser virtual modules, Vite/vavite integration, app layers, SSR route handling, config/env, and RealWorld usage.
4. Design options: renderer-first, runtime-harness-first, or dev-server-integration-first.
5. Requirements and acceptance criteria for the first implementation tranche.

## Likely First Tranche

The likely first tranche should prove one vertical path rather than every Storybook feature:

- a new or revived `@typed/storybook` framework package;
- a Vite-backed preset that installs `@typed/vite-plugin`;
- a Typed renderer that can mount simple templates/components;
- a server-aware story helper or decorator that can provide app layers and route/request context;
- one fixture story that runs a UI interaction against server-side Typed code;
- portable story or Vitest coverage for that fixture.

This is a hypothesis, not an approved plan.

## Explicit Non-Goals

- Do not make Storybook own Typed routing.
- Do not add local `declare module "typed:*"` shims in example projects.
- Do not hide server-side behavior behind untyped mock objects as the primary integration story.
- Do not standardize casts or local wrapper types when the framework can infer the surface.
- Do not treat the old `@typed/storybook` package as production-ready architecture.

## Approval Rule

This document is a draft until the human explicitly approves it. After `intent.md` and `scope.md` are approved, commit the Phase 1 artifacts and continue to requirements.
