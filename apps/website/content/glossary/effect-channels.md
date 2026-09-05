---
id: effect-channels
term: "Effect channels"
definition: "The success, expected-error, and required-service type parameters carried by Effect and Fx."
aliases: [A E R, success error requirements]
related: [effect, service, scope]
links: [https://www.effect.website/docs/v4/getting-started/the-effect-type/]
---

In `Effect<A, E, R>` and `Fx<A, E, R>`, `A` is the value, `E` is an expected failure, and `R` names
required services. An invoice lookup might produce invoice data, fail with a repository error, and
require an invoice repository service.

A wrapper should preserve that information. Declaring `never` for errors or requirements makes a
stronger promise than the implementation supports. Channels describe contracts; [Scope](#scope)
controls resource lifetime. See [library development](/explore/library-developers).
