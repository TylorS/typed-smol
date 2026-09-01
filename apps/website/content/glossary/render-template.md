---
id: render-template
term: RenderTemplate
definition: The service that interprets templates for a target renderer.
aliases: []
related: [render-event, effect, scope]
links: []
---

RenderTemplate turns a shared template program into target-specific output while retaining the same
Effect requirements and lifetime rules. DOM rendering applies events to local ranges; HTML rendering
serializes trusted chunks for [SSR](#ssr). The template service is a renderer choice, not a reason for
an integration to invent a framework adapter.

