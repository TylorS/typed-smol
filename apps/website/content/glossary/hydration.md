---
id: hydration
term: Hydration
definition: Attaching behavior to server-rendered DOM while preserving its identity.
aliases: []
related: [ssr, dynamic-range, keyed-identity]
links: []
---

Hydration reconnects behavior to nodes that already came from [SSR](#ssr). Stable markers identify
dynamic parts, so the client does not need to replace readable server output. Existing browser state,
external classes, and unowned siblings remain part of the document being shared.

