---
id: subject
term: Subject
definition: A push-capable input that can receive values.
aliases: []
related: [refsubject, fx, effect]
links: []
---

A Subject is useful where another producer needs to push values into an Effect-native graph. It is
an input boundary, not a renderer or an implicit global store. [RefSubject](#refsubject) adds a
readable current value while preserving the same pushed transition stream.

