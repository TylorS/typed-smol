---
id: dynamic-part
term: "Dynamic part"
definition: "One interpolation target in a Template that retains the exact DOM field or node range it updates."
aliases: [template part]
related: [dynamic-range, local-reconciliation, template]
links: []
---

A dynamic part may target text, an attribute, a property, a listener, or structural node output.
Scalar parts update their retained target directly. Node output is bounded by a
[dynamic range](#dynamic-range) and uses [local reconciliation](#local-reconciliation) only inside
that range.
