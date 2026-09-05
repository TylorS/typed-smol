---
id: matcher
term: "Matcher"
definition: "An immutable route table that selects reactive output for the current navigation location."
aliases: []
related: [route, router, fx]
links: []
---

A Matcher is an immutable table of ordered route cases that produces reactive output when run.
Registration builds the description; matching, guards, navigation observation, and selected-route
lifetime happen with the required Router services.

If a broad parameterized case captures a URL intended for a more specific case, inspect registration
order and guards. Changing browser history cannot resolve competing cases. See
[live route selection](/explore/router-navigation-live-selection) and the
[Matcher API](/reference/modules/%40typed%2Frouter%2FMatcher).
