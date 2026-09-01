---
id: html-render-event
term: HtmlRenderEvent
definition: A branded chunk of trusted, renderer-owned HTML output.
aliases: []
related: [render-event, ssr, fx]
links: []
---

`HtmlRenderEvent(html, last)` carries one ordered chunk and explicitly marks the terminal chunk. The
producer owns ordering, interruption, and cleanup. It is a transport boundary for a renderer that
already serialized safe HTML, not a sanitization shortcut for user data; ordinary template values
remain escaped.

