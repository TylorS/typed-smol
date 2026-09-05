---
title: Library developers
summary: Build composable reactive libraries, UI systems, and renderers while preserving values, errors, services, and resource ownership.
section: Learning paths
kind: guide
order: 0.2
---

A useful library should fit into a program without taking over its runtime. Typed gives you a shared vocabulary for values over time, current state, rendered output, and the resources that keep them alive.

This path is for building reusable components, design systems, adapters, and frameworks. Start with the contract your library actually needs.

## Preserve the three channels

`Fx<A, E, R>` describes emitted values, typed errors, and required services. The caller needs to see all three. A wrapper that replaces `E` with `unknown` or hides `R` behind a global singleton makes composition harder.

Learn [how Fx producers run](/explore/fx-push-reactivity), [how consumers receive values and failures](/explore/sink-writing-effects), and [where a subscription gets its services and Scope](/explore/fx-services-and-lifetime). Then choose an existing operator before inventing a new runtime abstraction.

The full [Fx module](/reference/modules/%40typed%2Ffx%2FFx) includes constructors, transformations, concurrency policies, resource handling, and consumers. [Subject](/explore/subject-event-publications) is for publications; [RefSubject](/explore/refsubject-renderer-independent-state) also models current state. Their contracts are different.

## Make state independent of presentation

A selection model can serve a menu, a command palette, and a test without importing a DOM renderer. Keep the state and its operations separate from the host markup.

[Shared state contracts](/explore/shared-state-contracts) and [specialized state modules](/explore/specialized-refsubject-state) show the tools. [Bidirectional views and transactions](/explore/state-transactions-and-bidirectional-views) explain when an update should flow back to a source and when several changes should be observed together.

Treat equality, initial values, subscriptions, and cleanup as part of the public behavior. A short type is useful when its semantics stay clear.

## Compose a UI library around native hosts

Typed UI separates state, behavior, and host rendering. A styled button can apply the same interaction props to a different host without reimplementing its state machine.

Follow [Building UI components](/explore/building-ui-components), then [collections and focus](/explore/ui-collections-and-focus). The latter matters when a control needs keyboard navigation, disabled items, or a controlled selection. Use the browser's existing semantics before adding your own.

For a design system, decide which layer owns each concern:

| Concern | Typical owner |
| --- | --- |
| Selected value and commands | A state model |
| Keyboard interaction and accessibility props | A Typed UI primitive |
| Native element and applied props | The component host |
| Spacing, color, typography, and variants | Your styles and tokens |
| Subscription and listener cleanup | The running Effect Scope |

## Adapt the smallest rendering boundary

Choose the boundary based on the output you already have:

- Existing nodes: [DomRenderEvent](/explore/dom-render-event).
- A group of nodes that must move together: [Wire](/explore/wire-and-rendered-dom-output).
- Trusted server output: [HtmlRenderEvent](/explore/html-render-event).
- A different interpretation of template literals: [RenderTemplate](/explore/implementing-render-template).

The [compilation pipeline](/explore/template-compilation-pipeline) explains parsing, parts, and renderer selection. [Cooperative DOM ownership](/explore/cooperative-by-design) explains which nodes and properties an adapter may change. Rendering into a root host is a stronger boundary than updating a nested dynamic range.

The [Astro integration](/integrate/astro) is a complete example of this composition: Astro supplies the host lifecycle and loading policy; Typed supplies rendering and scoped subscriptions. Other [integration recipes](/integrate) show how to compose with existing UI systems.

## Make lifetime behavior observable

Document when work starts, what it owns, and what stops it. Test cancellation, errors, replacement, and cleanup as behaviors. For DOM integrations, test retained node identity and actual native interaction as well as rendered text.

[Testing Typed systems](/explore/testing-typed-systems) is the starting point. Effect's [Scope](https://effect.website/docs/v4/resource-management/scope/) and [Layer](https://effect.website/docs/v4/requirements-management/layers/) provide the runtime vocabulary; your library should preserve it rather than requiring a second lifecycle system.
