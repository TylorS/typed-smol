---
id: computed
term: Computed
definition: A read-only, changing view derived from a RefSubject or another versioned source.
aliases: []
related: [refsubject, filtered, fx]
links: []
---

A Computed preserves the source's current-read, error, service, and change behavior while removing
writable transitions. It is the right result for a derived value such as a label, count, or selected
state. A [Filtered](#filtered) is the related conditional form whose value may be absent.
