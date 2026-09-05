---
id: ssr
term: "SSR"
definition: "Rendering semantic HTML on the server."
aliases: [server-side rendering]
related: [hydration, html-render-event, render-template]
links: []
---

Server-side rendering produces useful HTML before a browser runs client code. A trusted renderer
can stream [HtmlRenderEvent](#html-render-event) chunks in order and mark completion explicitly;
the client later hydrates dynamic ranges without throwing away the server document. Application
data still follows the normal escaped template path.

