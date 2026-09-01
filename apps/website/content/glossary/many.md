---
id: many
term: many
definition: A keyed Template collection that retains an item's rendered range and child scope while its key remains.
aliases: []
related: [keyed-identity, local-reconciliation, template]
links: []
---

`many(values, key, renderItem)` is for a live collection whose order or membership can change. A
retained key keeps the item's rendered identity; a removed key closes that item's work. It is a
collection-level contract for [local reconciliation](#local-reconciliation), not a general array
helper.
