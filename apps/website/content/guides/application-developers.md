---
title: Application developers
summary: Build a product with reactive state, typed templates, accessible controls, and explicit application boundaries.
section: Learning paths
kind: guide
order: 0.1
---

You have a product to build. It needs state, a usable interface, and a way to connect both to the outside world. Typed supplies those pieces as libraries built on [Effect](https://effect.website/docs/v4/).

You can use a RefSubject without a template, a template without routing, or one Typed island inside an Astro site. Choose a starting point that matches the work in front of you.

## Get something running

Follow the [Quick Start](/explore/quick-start). It introduces one view, one state value, and one event handler. You will see where the application starts and how its lifetime ends. The later sections take the same template through server rendering and hydration.

Already building with Astro? Start with the [Astro integration](/integrate/astro). Astro owns the page and decides when to load an island. Typed owns the island's rendered output and subscriptions.

## Keep your model useful outside the view

When an order quantity changes, both the displayed count and the total need to change. Keep the quantity in a [RefSubject](/explore/refsubject-renderer-independent-state) and derive the total from it. Do not maintain two writable copies of the same fact.

Learn these operations in order:

1. [Create and observe state](/explore/refsubject-sources-equality-and-lifetime).
2. [Compose several state values](/explore/composing-refsubject-state).
3. [Derive conditional and accumulated state](/explore/derived-conditional-and-accumulated-state).
4. [Update related values together](/explore/state-transactions-and-bidirectional-views).

The [TodoMVC tutorial](/explore/tutorial) applies this separation to domain rules, application commands, presentation, and browser storage. Those boundaries become useful as the application grows; a small view does not need a directory for each one.

## Turn state into an interface

Start with [template values and native events](/explore/render-your-first-template). Templates accept the RefSubject itself, and event bindings accept Effects. You do not need a manual subscribe-and-render loop.

Then learn the parts that become important in a real interface:

- [Properties and boolean attributes](/explore/template-element-bindings) keep controls synchronized with current state.
- [Keyed collections](/explore/keyed-template-collections) preserve the identity of retained list items.
- [UI components](/explore/choosing-ui-components) supply reusable browser interaction behavior.
- [Forms](/explore/forms-as-a-browser-contract) connect decoded values, validation, and submission.
- [Overlays](/explore/overlays-disclosure-and-transient-ui) keep dialogs and popovers aligned with the browser.

Use Tailwind, DaisyUI, or your own CSS to style the hosts. Typed UI owns behavior and exposes native elements; your design system owns the visual language.

## Connect requests and navigation

An autocomplete request should stop when a newer query replaces it. A save operation may need to finish before another begins. These are different concurrency decisions. [Fx flattening policies](/explore/fx-higher-order-and-concurrency) make the choice explicit.

Use [AsyncData](/explore/async-data) to describe request state and [error recovery](/explore/fx-errors-and-recovery) to decide which failures belong in the interface. Keep the useful value visible during a refresh when that matches the product.

For URLs, [Route](/explore/route-typed-url-inputs) describes inputs, [Navigation](/explore/navigation-as-an-effect-service) owns history operations, and [Router](/explore/router-navigation-live-selection) selects live views. They remain separate so each can be tested or supplied independently.

## Test the boundary you care about

Test domain rules as ordinary functions. Run state transitions with Effect. Mount a view when you need to prove DOM behavior, focus, or node identity. [Testing Typed systems](/explore/testing-typed-systems) covers these layers with deterministic services and real browser checks.

When you need an exact signature, the [API reference](/reference) follows the public imports. For Effect itself, keep [the Effect documentation](https://effect.website/docs/v4/) close: Typed carries its error, dependency, and resource model into reactive programs.
