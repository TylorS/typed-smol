# Memory Inbox

## 2026-05-22 - M1 Shared Diagnostics

- Start shared diagnostics in `@typed/compiler` before host integrations.
- Keep host adapters thin and pure; no Vite or VS Code imports in compiler core.
- Subagent routing policy conflict recorded in execution log because available tool requires explicit user request.

## 2026-05-22 - M3 Serialization Descriptors

- Keep `@typed/app` serialization descriptors additive and runtime-safe.
- Store only public generated descriptor metadata in `@typed/app`; keep compiler schema-plan internals in `@typed/compiler`.
- Preserve explicit user Schema precedence with a public helper so compiler emit can short-circuit type-directed generation.
