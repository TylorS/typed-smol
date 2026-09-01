---
id: scope
term: Scope
definition: The lifetime boundary for acquisition and finalization.
aliases: []
related: [effect, fx, cooperative-ownership]
links: [https://www.effect.website/docs/v4/resource-management/scope/]
---

An Effect Scope registers finalizers and runs them when the scope closes. An Fx run uses that
structured lifetime for subscriptions, callback producers, and acquired foreign mounts. Closing the
Scope interrupts producers before releasing resources, so an event such as [DomRenderEvent](#dom-render-event)
can stay a pure output value rather than pretending to own cleanup.
