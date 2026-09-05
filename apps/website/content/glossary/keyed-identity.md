---
id: keyed-identity
term: "Keyed identity"
definition: "A stable key associating data with an existing rendered node."
aliases: []
related: [dynamic-range, wire, dom-render-event]
links: []
---

Keys let reconciliation move an exact node when data reorders. That preserves focus, selection,
custom-element state, and other browser-owned state where the platform supports move semantics;
`insertBefore` remains the compatibility fallback. Keys describe identity inside a [dynamic range](#dynamic-range),
not ownership of the surrounding document.

