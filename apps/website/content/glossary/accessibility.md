---
id: accessibility
term: "Accessibility"
definition: "Native semantic and interaction behavior that remains usable across input methods and assistive technology."
aliases: [a11y]
related: [ui, template, cooperative-ownership]
links: []
---

Accessibility is part of the rendered contract, not a post-render decoration. Prefer native elements
and their browser behavior first; use ARIA only to express behavior the native host cannot provide.
Typed UI composes that behavior through [UI](#ui) and [Template](#template) without replacing the
browser's focus, keyboard, form, or announcement semantics.
