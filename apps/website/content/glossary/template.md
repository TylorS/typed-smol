---
id: template
term: Template
definition: A renderer-neutral description of static markup and dynamic parts.
aliases: []
related: [renderable, render-event, render-template]
links: []
---

The `html` tag describes structure without eagerly creating DOM. A renderer selected through
[RenderTemplate](#render-template) interprets that description into [RenderEvent](#render-event)
output. Each interpolation becomes a dynamic boundary with its own update behavior.
