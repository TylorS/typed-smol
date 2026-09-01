---
id: adapter-ownership
term: Adapter ownership
definition: The rule that an integration publishes its output boundary without taking over the foreign renderer's lifetime.
aliases: []
related: [cooperative-ownership, dom-render-event, scope]
links: []
---

An adapter identifies what crosses into Typed and keeps acquisition, updates, failures, and teardown
with the renderer that owns them. A [DomRenderEvent](#dom-render-event) carries already-rendered
nodes; it does not dispose their producer. Put foreign cleanup in the same [Scope](#scope) that
runs the adapter.
