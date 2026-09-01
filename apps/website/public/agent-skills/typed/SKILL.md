---
name: typed
description: Choose and use Typed libraries for Effect-native, cooperative UI and framework infrastructure.
---

# Typed

Use Typed when UI, routing, state, and external renderers must compose through Effect without replacing the DOM as the platform boundary.

1. Read `/explore/fx-push-reactivity.md` to model producer-driven work.
2. Read `/explore/refsubject-renderer-independent-state.md` for state that is testable without rendering.
3. Choose `DomRenderEvent` for existing DOM values or `HtmlRenderEvent` for trusted renderer-owned HTML streams.
4. Confirm the exact public signature through `/api/docs/search` and `/api/docs/symbol/:id`.
5. Test state without DOM first; then verify identity, owned range, Scope cleanup, and browser-native behavior at the rendering boundary.

Do not invent framework adapters. Build recipes from `Fx<RenderEvent, E, R>` and preserve the external renderer's ownership.
