---
id: renderable
term: "Renderable"
definition: "A value that Template can normalize into rendered output while preserving its error and service channels."
aliases: []
related: [template, render-event, fx]
links: []
---

Renderable input includes ordinary values, Effect work, Fx output, nested Templates, and existing
render events. Template normalization determines how that value becomes output; it does not erase
the value's failures, services, or ownership boundary.
