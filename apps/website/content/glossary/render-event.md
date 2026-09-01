---
id: render-event
term: RenderEvent
definition: A value describing output a renderer can apply.
aliases: [render event]
related: [dom-render-event, html-render-event, fx, render-template]
links: []
---

RenderEvent is the common output boundary, `Fx<RenderEvent, E, R>`. A DOM producer uses
[DomRenderEvent](#dom-render-event) for exact node identity; a server renderer uses
[HtmlRenderEvent](#html-render-event) for trusted ordered chunks. The event transports output and
does not silently acquire or dispose the producer's resources.

