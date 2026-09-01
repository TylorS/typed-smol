---
id: sink
term: Sink
definition: A consumer of pushed Fx values.
aliases: []
related: [fx, effect, scope]
links: []
---

A Sink receives successes and complete failure Causes as Effect callbacks. It contributes its own
environment requirements to the Fx run, so consuming a stream remains explicit and composable.
Ordering and interruption are controlled by the producer and the consuming run's [Scope](#scope).

