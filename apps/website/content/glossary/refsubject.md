---
id: refsubject
term: "RefSubject"
definition: "A current value plus a pushed stream of changes."
aliases: []
related: [subject, fx, effect]
links: []
---

RefSubject keeps state renderer-independent: callers can read the current value, apply an update,
and observe future changes without mounting a component. Derived views can be composed from the same
[Effect](#effect) channels and tested directly before any DOM integration is chosen.

