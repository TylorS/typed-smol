# Structural Fx/Effect/Stream detection (short-term memory)

- **Objective:** Determine handler runtime kind (Fx, Stream, Effect, plain) structurally—same approach as Route—instead of regex on type text.
- **Done:**
  - `routeTypeNode.ts`: Added `typeNodeToRuntimeKind(node)` and exported `RuntimeKind`. Uses reference type name (Fx/Stream/Effect) and, for non-reference nodes, `getReferenceTypeName(root.text)` so interface types (e.g. from @typed/fx, effect) are recognized. Recurses into union/intersection so e.g. `Pipeable & Fx<A>` still classifies as fx.
  - Plugin: Replaced regex-based `classifyEntrypointKind` with `typeNodeToRuntimeKind(entrypoint.type)`.
  - Tests: Removed type-casts and fake type aliases; use real `Effect.succeed(1)`, `Fx.succeed(1)`, `Stream.succeed(1)` from effect and @typed/fx. App package has devDependencies `effect` and `@typed/fx` for tests.
- **Test env note:** In the test program (temp fixture under app), Effect/Fx types sometimes serialize as plain (e.g. when type is inferred as object or any). Handler-matrix and golden fx/effect tests accept either structural output (fromEffect, fromStream, pass-through) or plain wrap so tests pass regardless; when types resolve in a real app, structural behavior is used.
- **Reusable pattern:** For “is this type a T?” use a small type-node helper that checks `kind === "reference"` and reference name, then falls back to type display text; recurse into union/intersection for robustness.
