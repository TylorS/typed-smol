---
id: dynamic-range
term: Dynamic range
definition: The bounded DOM region controlled by one structural part.
aliases: []
related: [keyed-identity, dom-render-event, cooperative-ownership]
links: []
---

Structural reconciliation compares only the range controlled by a dynamic part. Equal head and tail
runs can be skipped, while inserts, removals, and keyed moves stay inside that range. This local
boundary is why an update need not traverse a virtual copy of the entire page.

