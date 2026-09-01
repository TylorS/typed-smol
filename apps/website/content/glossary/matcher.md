---
id: matcher
term: Matcher
definition: An immutable route table that selects reactive output for the current navigation location.
aliases: []
related: [route, router, fx]
links: []
---

A Matcher combines ordered [Route](#route) cases and produces `Fx` output when it runs. Registration
is pure; matching, guard evaluation, selected-route lifetime, and navigation observation happen only
with a [Router](#router) and its required services.
