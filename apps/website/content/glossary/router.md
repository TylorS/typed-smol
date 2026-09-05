---
id: router
term: "Router"
definition: "The navigation service layer that supplies current route context and route-selection lifetime."
aliases: []
related: [route, matcher, scope]
links: []
---

Browser, server, and test routers provide the same routing contract with different navigation
implementations. A Router supplies the environment a [Matcher](#matcher) needs; its running
[Scope](#scope) owns subscriptions and selected-route teardown.
