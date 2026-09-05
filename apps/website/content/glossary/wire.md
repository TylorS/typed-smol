---
id: wire
term: "Wire"
definition: "A stable group of DOM nodes treated as one rendered value."
aliases: []
related: [dom-render-event, keyed-identity, dynamic-range]
links: []
---

Wire groups multiple nodes without inserting a wrapper element. A [DomRenderEvent](#dom-render-event)
can carry a Wire so reconciliation preserves each member's identity while moving or replacing the
group inside its dynamic range. Wire describes rendered shape; the producer still owns its lifetime.

