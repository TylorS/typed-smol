---
id: route
term: "Route"
definition: "An immutable URL contract that parses a path and query into typed, validated parameters."
aliases: []
related: [matcher, router, service]
links: []
---

A Route owns URL syntax and decoding, not rendering or browser history. A [Matcher](#matcher) uses
the Route to choose output, while a [Router](#router) provides the navigation context in which that
selection runs. Schema-backed decoding requirements remain explicit services.
