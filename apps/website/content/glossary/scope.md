---
id: scope
term: "Scope"
definition: "The lifetime boundary for acquisition and finalization."
aliases: []
related: [effect, fx, cooperative-ownership]
links: [https://www.effect.website/docs/v4/resource-management/scope/]
---

A Scope registers finalizers and closes the lifetime that acquired resources. Scoped fibers,
subscriptions, and mounts connect their active work to that boundary rather than relying on an
unrelated DOM removal or a global cleanup list.

A template’s first output can arrive while its listeners remain owned by an ambient Scope. Finishing
`take(1)` is therefore not proof of unmounting. Close the actual render Scope to test teardown. See
[lifetime contracts](/explore/fx-services-and-lifetime) and [cleanup tests](/explore/testing-typed-systems).
