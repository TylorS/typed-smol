import { html } from "@typed/template";
import { recipes } from "../docs/Recipes.js";
import { recipeCard } from "./RecipePage.js";
import { siteHref } from "../SiteHref.js";

export const Integrate = html`
  <main id="main-content" class="page integrate-page" tabindex="-1">
    <header class="page-head integrate-hero">
      <span class="index">INTEGRATE</span>
      <h1>Bring another renderer with you.</h1>
      <p>
        These recipes are for adapter authors. Pass existing DOM or HTML into Typed, or embed Typed
        inside React, Svelte, Vue, and Web Components. Each recipe uses the framework's real API and
        keeps cleanup with the renderer that created the output.
      </p>
    </header>

    <section class="integration-paths" aria-labelledby="integration-paths-title">
      <h2 id="integration-paths-title">Choose what you already have.</h2>
      <div class="integration-paths__grid">
        <a href=${siteHref("/integrate/dom-output")}>
          <strong>DOM already exists</strong>
          <span>Pass exact nodes to Typed without cloning or reparsing them.</span>
        </a>
        <a href=${siteHref("/integrate/html-output")}>
          <strong>HTML already exists</strong>
          <span>Carry trusted serializer output into Typed SSR.</span>
        </a>
        <a href=${siteHref("/integrate/react")}>
          <strong>A framework owns the component</strong>
          <span>Use React, Svelte, Vue, or a Web Component in either direction.</span>
        </a>
      </div>
    </section>

    <section
      id="recipe-directory"
      class="recipe-directory"
      aria-labelledby="recipe-directory-title"
    >
      <header class="recipe-directory__heading">
        <div>
          <span class="index">RECIPES</span>
          <h2 id="recipe-directory-title">Working adapters.</h2>
        </div>
      </header>
      <div class="recipe-grid">${recipes.map((recipe, index) => recipeCard(recipe, index))}</div>
    </section>
  </main>
`;
