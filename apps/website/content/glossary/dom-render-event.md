---
id: dom-render-event
term: "DomRenderEvent"
definition: "A RenderEvent containing already-rendered DOM values."
aliases: []
related: [render-event, wire, dynamic-range, cooperative-ownership]
links: []
---

`DomRenderEvent` accepts a Node, DocumentFragment, Wire, or nested readonly collection of rendered
values. It carries those exact objects across the [RenderEvent](#render-event) boundary without
cloning them or claiming surrounding DOM ownership. The producing Fx decides when another node set
is emitted; its Scope owns subscriptions and foreign cleanup.

