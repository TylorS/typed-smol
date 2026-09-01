---
id: effect-channels
term: Effect channels
definition: The success, expected-error, and required-service type parameters carried by Effect and Fx.
aliases: [A E R, success error requirements]
related: [effect, service, scope]
links: [https://www.effect.website/docs/v4/getting-started/the-effect-type/]
---

In `Effect<A, E, R>` and `Fx<A, E, R>`, `A` is the success value, `E` is an expected error a caller
can handle, and `R` names the [services](#service) needed to run the work. A channel is a contract in
the type; it does not itself acquire a resource. [Scope](#scope) controls acquired-resource lifetime.
