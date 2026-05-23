# Intent — Storybook Framework Integration

Status: approved on 2026-05-22.

## Problem

Typed needs a first-party Storybook integration that is deeper than the old `@typed/storybook` renderer. The old package proved that Typed templates can render into Storybook's canvas, but it primarily treated Storybook as a browser-only component renderer.

The new direction should treat Storybook as a Typed app workshop: UI stories, route stories, server-rendered stories, HttpApi-backed stories, form/workflow stories, and app-layer dependency stories should be testable through the same framework surfaces users rely on in real Typed apps.

## Desired Outcome

Design a strict-mode roadmap for a Typed Storybook framework package that feels closer to Next.js, Remix, and SvelteKit Storybook integrations than to a renderer-only adapter.

The intended end state is:

- Typed publishes a Storybook framework package, likely `@typed/storybook`, with Storybook-compatible framework, preset, preview, renderer, and portable story testing surfaces.
- Stories can render plain Typed components and templates without requiring route/server setup.
- Stories can opt into Typed app context: router, navigation, config, env, app layers, HttpApi clients, server actions or route handlers, and SSR document rendering.
- Server-side code can be exercised intentionally in stories and portable tests, not only mocked at component props.
- The integration reuses current Typed framework primitives such as `typed:server`, `typed:browser`, `typed:config`, `@typed/vite-plugin`, `@typed/app/runtime`, `TypedHttpServer`, router virtual modules, and HttpApi virtual modules.
- The implementation remains virtual-module-first and does not create hidden app routing or local type shims.

## Product Thesis

Storybook for Typed should become a framework-aware development and testing surface. A story should be able to describe a UI state, a route state, or a server-backed workflow state, then run with the same typed app-layer composition model that production code uses.

## Priority Biases

- Framework fidelity before renderer convenience.
- Server/client parity before broad addon polish.
- Inference and type safety before local story wrappers or casts.
- Explicit virtual module imports before hidden routing conventions.
- Portable tests and interaction tests before visual-only demos.
- Minimal first tranche that proves the architecture with one real server-backed workflow.

## Open Questions

- Should the first tranche target component stories with optional app layers, route stories with SSR, or HttpApi-backed workflow stories?
- Should server-side story execution happen inside Storybook's dev server process, through a Typed in-memory request harness, or through a real local Typed HTTP server?
- How much of `typed:server` should be reused directly versus factoring out a Storybook-specific runtime module?
- What should a story author write for server-backed stories: decorators, loaders, route fixtures, layer fixtures, or Typed-specific CSF helpers?
- Should RealWorld become the first acceptance fixture, or should the workflow start with a smaller fixture app?
- What is the compatibility target for Storybook major version and builder API?

## Decisions

- Mode: `strict`.
- Finalization: merge into `codex/typed-beta`.
- Use the old `@typed/storybook` package as reference material, not as the architecture boundary.
- Treat this as a meta-framework integration design, not just a renderer port.
- Keep existing workflow folders reference-only unless the human explicitly asks to continue one.

## Approval Rule

This document is a draft until the human explicitly approves it. After `intent.md` and `scope.md` are approved, commit the Phase 1 artifacts and continue to requirements.
