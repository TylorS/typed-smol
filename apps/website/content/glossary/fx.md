---
id: fx
term: "Fx"
definition: "A push-based stream of values with typed errors and requirements."
aliases: []
related: [effect, render-event, sink]
links: [https://www.effect.website/docs/v4/getting-started/the-effect-type/, https://www.effect.website/docs/v4/stream/introduction/]
---

The producer decides when values exist: a key arrives, a socket receives a packet, or an external
renderer publishes a new node set. `Fx<A, E, R>` preserves the value, error, and environment
channels while adapting that push boundary. Running an Fx is an Effect owned by its fiber and
[Scope](#scope); constructing it starts no work. A [Sink](#sink) receives values in producer order.
