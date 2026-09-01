---
id: cooperative-ownership
term: Cooperative ownership
definition: Updating only the DOM and lifetime a participant owns.
aliases: []
related: [dynamic-range, scope, wire]
links: []
---

Typed treats ownership as a boundary that can be shared. A template owns the dynamic range it
created and the subscriptions that drive it; it does not claim external classes, sibling nodes,
native event behavior, or a foreign renderer's resources. See the [dynamic range](#dynamic-range)
and [Scope](#scope) entries for the two halves of that contract.

