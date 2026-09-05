---
id: filtered
term: "Filtered"
definition: "A conditional read-only state view whose current value may be absent."
aliases: []
related: [computed, refsubject, fx]
links: []
---

Filtered preserves conditional absence rather than silently substituting a value. It behaves like a
[Computed](#computed) view with an additional absent case, so a current read can report that no value
is available while later source changes can make one available.
