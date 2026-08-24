# `@typed/svelte` prototype implementation plan

> Implement incrementally. For each behavior, add the focused failing test before its production code and rerun it after the smallest implementation.

## 1. Package and build surface

- Add `packages/svelte` with `@sveltejs/package`, Svelte/Vitest configuration, package metadata, and TypeScript project references.
- Add only the Svelte versions needed by the package to the workspace catalog and lockfile.
- Verify an empty/public skeleton packages successfully before integration behavior is added.

## 2. Store boundary

- Add node tests for scoped `toReadable` propagation and cleanup.
- Add node tests for bidirectional `toWritable` synchronization with a `RefSubject`.
- Implement adapters using the current Effect context and owning Scope; keep them constrained to `E = never`.

## 3. DOM Svelte renderer

- Add a stateful Svelte fixture and browser test proving initial mount, reactive prop updates, mount-once behavior, local-state preservation, and scoped unmount.
- Add the internal Svelte bridge component driven by a `Readable<Props>`.
- Add `SvelteRender`, `view`, source normalization, and the `Dom` layer.

## 4. HTML renderer and nested hydration

- Add a node SSR test for body output, first-value props, context/options forwarding where observable, and head collection.
- Implement the `Html` layer with Svelte server rendering and renderer-owned `HtmlRenderEvent` insertion.
- Add a Chromium test using the exact server host shape to prove nested Svelte hydration reuses DOM, preserves local state, and accepts later Typed prop updates without hydration warnings.

## 5. ManagedRuntime attachment

- Add a Svelte fixture that uses real `{@attach ...}` syntax.
- Add a Chromium test proving Typed render, reactive attachment replacement, detach finalization, and continued runtime usability.
- Implement the attachment factory with one scoped render fiber per attachment and interrupt-only cleanup.

## 6. Public API, docs, and validation

- Add type tests for component prop inference, renderer requirements, store adapter failure constraints, and attachment runtime requirements.
- Document both directions, SSR behavior, runtime ownership, examples, and prototype limits.
- Run package node/browser/type tests, package build, root project-reference build for the new package, formatting/lint checks on touched files, `git diff --check`, and inspect packed contents.
