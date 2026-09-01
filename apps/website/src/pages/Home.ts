import { html } from "@typed/template";
import { TermLink } from "../components/TermLink.js";
import { fxCombinatorCount } from "../generated/catalog.js";

export const Home = html`
  <main id="main-content" class="home" tabindex="-1">
    <section class="home-hero" aria-labelledby="home-title">
      <span class="eyebrow">Typed / framework infrastructure</span>

      <div class="hero-copy">
        <h1 id="home-title">
          Cooperative<br />
          by design
        </h1>
        <p class="lede">
          Libraries built on <a href="https://www.effect.website/docs/v4">Effect v4</a> for
          applications, design systems, and frameworks without surrendering the platform.
        </p>
        <div class="actions">
          <a class="button" href="/explore">Explore the architecture →</a>
          <a href="/integrate">Integration recipes</a>
        </div>
      </div>

      <aside class="contract hero-contract" aria-label="Typed UI contract">
        <code>Fx&lt;RenderEvent, E, R&gt;</code>
        <p>Any UI. Explicit errors. Explicit requirements. One compositional vocabulary.</p>
        <dl>
          <div>
            <dt>Core</dt>
            <dd>Fx</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>RefSubject</dd>
          </div>
          <div>
            <dt>Build</dt>
            <dd>UI and frameworks</dd>
          </div>
        </dl>
      </aside>
    </section>

    <section class="chapter fx-chapter" aria-labelledby="fx-title">
      <div class="chapter-heading">
        <span class="index chapter-kicker">01 / FX</span>
        <h2 id="fx-title">Model the whole reactive application.</h2>
      </div>
      <div class="chapter-grid">
        <div>
          <p>
            ${TermLink("fx", "Fx")} models commands, requests, workers, schedules, and
            subscriptions as one typed program. Transform values, start concurrent work, recover
            expected failures, provide services, and interrupt the entire process through Effect.
            Zero, one, or many results use the same vocabulary.
          </p>
          <a class="chapter-link" href="/explore/fx-push-reactivity"
            >Learn Fx from sources to consumers →</a
          >
        </div>
        <p class="chapter-note">
          <strong>A complete reactive vocabulary</strong>
          <code>map</code>, <code>filter</code>, <code>mapEffect</code>, <code>flatMap</code>,
          <code>switchMap</code>, <code>merge</code>, <code>zipLatest</code>, <code>scan</code>,
          <code>debounce</code>, and <code>retry</code> cover the stream operators people reach for
          every day.
          <a
            class="chapter-note__more"
            href="/reference/modules/%40typed%2Ffx%2FFx#category-combinators"
          >
            And so much more: ${fxCombinatorCount} public combinators and counting →
          </a>
        </p>
      </div>
    </section>

    <section class="chapter state-chapter" aria-labelledby="state-title">
      <div class="chapter-heading">
        <span class="index chapter-kicker">02 / STATE</span>
        <h2 id="state-title">State, without a renderer.</h2>
      </div>
      <div class="chapter-grid">
        <div>
          <p>
            ${TermLink("refsubject", "RefSubject")} makes state its own layer. Build your model
            once, derive new views of it, and test every transition without mounting a component or
            touching the DOM. When it is time to render, any UI can consume the same state without
            owning it.
          </p>
          <a class="chapter-link" href="/explore/refsubject-renderer-independent-state">
            Explore renderer-independent state →
          </a>
        </div>
        <p class="chapter-note">
          <strong>Test stateful code without rendering</strong>
          Exercise transitions and derived state directly whenever UI is not part of what you need
          to prove. When a component owns the state, its lifecycle can own the
          ${TermLink("refsubject", "RefSubject")} too.
        </p>
      </div>
    </section>

    <section class="chapter template-chapter" aria-labelledby="template-title">
      <div class="chapter-heading">
        <span class="index chapter-kicker">03 / TEMPLATE</span>
        <h2 id="template-title">Declarative templates. Real DOM.</h2>
      </div>
      <div class="chapter-grid">
        <div>
          <p>
            Write familiar HTML and compose it with any ${TermLink("fx", "Fx")}. Typed captures
            each dynamic location once, so scalar changes update in O(1) relative to the
            surrounding tree. Structural changes stay local, using optimized, identity-aware diffs
            that reuse existing nodes whenever possible.
          </p>
          <a class="chapter-link" href="/explore/dom-updates-and-reconciliation">
            Explore Template →
          </a>
        </div>
        <p class="chapter-note">
          <strong>The DOM is the API</strong>
          Bring custom elements, framework output, or hand-written DOM. Typed works with real nodes
          and real events, changes only what it owns, and leaves everything else intact.
        </p>
      </div>
    </section>

    <section class="chapter ui-chapter" aria-labelledby="ui-title">
      <div class="chapter-heading">
        <span class="index chapter-kicker">04 / UI</span>
        <h2 id="ui-title">Accessible interaction, built on the web.</h2>
      </div>
      <div class="chapter-grid">
        <div>
          <p>
            Typed UI gives you the behavior behind dialogs, popovers, menus, tabs, comboboxes,
            grids, and more. Keyboard navigation, focus, selection, typeahead, and ARIA
            relationships are modeled together, while application state and visual design remain
            yours.
          </p>
          <a class="chapter-link" href="/explore/building-ui-components"
            >Explore accessible UI components →</a
          >
        </div>
        <p class="chapter-note">
          <strong>Meaning before machinery</strong>
          A button is still a button. Dialog, popover, details, anchors, focus, and DOM events keep
          their native semantics. Typed adds the coordination richer interactions need.
        </p>
      </div>
    </section>

    <section class="chapter interoperability-chapter" aria-labelledby="interoperability-title">
      <div class="chapter-heading">
        <span class="index chapter-kicker">05 / INTEROPERABILITY</span>
        <h2 id="interoperability-title">The DOM is common ground.</h2>
      </div>
      <div class="chapter-grid">
        <div>
          <p>
            Typed works alongside the code already on the page. Custom elements, hand-written DOM,
            third-party widgets, and other renderers keep their nodes and ownership. Typed updates
            only the fields and ranges it creates.
          </p>
          <a class="chapter-link" href="/integrate">Build an integration →</a>
        </div>
        <p class="chapter-note">
          <strong>Output moves both ways</strong>
          Bring DOM or HTML into Typed—or expose Typed output to another renderer. Each side keeps
          control of its own lifecycle.
        </p>
      </div>
    </section>

    <section class="chapter router-chapter" aria-labelledby="router-title">
      <div class="chapter-heading">
        <span class="index chapter-kicker">06 / ROUTER</span>
        <h2 id="router-title">Every URL becomes a typed value.</h2>
      </div>
      <div class="chapter-grid">
        <div>
          <p>
            Every <code>Route.*</code> constructor produces a Schema-backed route. Path and query
            parameters decode into domain values, malformed input remains typed, and every route
            composes through the same representation. <code>Matcher</code> delegates route
            selection directly to <code>find-my-way-ts</code>—the same radix-tree foundation behind
            Effect's <code>HttpRouter</code>—then carries each handler's output, errors, and services
            through ${TermLink("fx", "Fx")}.
          </p>
          <a class="chapter-link" href="/explore/router-navigation-live-selection">
            Explore truly type-safe routing →
          </a>
        </div>
        <p class="chapter-note">
          <strong>Migrate one route at a time</strong>
          A matcher can produce Typed UI, another framework's output, data, redirects, commands, or
          anything else. Keep one Effect and Fx application model while individual pages move
          between renderers. <code>BrowserRouter</code>, <code>ServerRouter</code>, and
          <code>TestRouter</code> change the environment, not the routes.
        </p>
      </div>
    </section>

    <section class="chapter start-chapter" aria-labelledby="start-title">
      <div class="chapter-heading">
        <span class="index chapter-kicker">07 / START HERE</span>
        <h2 id="start-title">Follow the path that matches your work.</h2>
      </div>
      <div class="start-paths">
        <a class="start-path" href="/explore">
          <span class="start-path__audience">Application authors</span>
          <h3>Explore</h3>
          <p>
            Learn the architecture and follow practical guides from Fx through state, templates,
            accessible UI, routing, SSR, and testing.
          </p>
          <span class="start-path__action">Build with Typed →</span>
        </a>
        <a class="start-path" href="/integrate">
          <span class="start-path__audience">Framework and library authors</span>
          <h3>Integrate</h3>
          <p>
            Connect another renderer through bidirectional DOM and HTML recipes while each system
            keeps its own lifecycle.
          </p>
          <span class="start-path__action">Extend the ecosystem →</span>
        </a>
        <a class="start-path" href="/reference">
          <span class="start-path__audience">Implementers and agents</span>
          <h3>Reference</h3>
          <p>
            Inspect every public package, module, symbol, and overload—with error and requirement
            channels, available examples, and source links.
          </p>
          <span class="start-path__action">Find the exact contract →</span>
        </a>
      </div>
    </section>
  </main>
`;
