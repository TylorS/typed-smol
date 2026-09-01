import { Fx } from "@typed/fx";
import * as Router from "@typed/router";
import { Effect } from "effect";
import { Layout } from "./Layout.js";
import { guides } from "./docs/Content.js";
import { loadExposure, loadModule, loadPackage } from "./docs/LoadReference.js";
import { Explore } from "./pages/Explore.js";
import { Glossary } from "./pages/Glossary.js";
import { Guide } from "./pages/Guide.js";
import { Home } from "./pages/Home.js";
import { Integrate } from "./pages/Integrate.js";
import { RecipePage } from "./pages/RecipePage.js";
import { ModulePage, PackagePage, Reference } from "./pages/Reference.js";
import { SymbolPage } from "./pages/Symbol.js";

const symbolRoute = Router.Parse("/reference/:id");
const packageRoute = Router.Parse("/reference/packages/:id");
const moduleRoute = Router.Parse("/reference/modules/:id");
const guideRoute = Router.Parse("/explore/:slug");

const loadGuide = ({ slug }: { readonly slug: string }) => {
  const guide = guides.find((candidate) => candidate.slug === slug);
  return guide === undefined ? Effect.succeedNone : Effect.succeedSome(guide);
};

export const appRoutes = Router.match(Router.Slash, Home)
  .match(Router.Parse("/explore"), Explore)
  .match(guideRoute, loadGuide, Fx.switchMap(Guide))
  .match(Router.Parse("/integrate"), Integrate)
  .match(Router.Parse("/integrate/dom-output"), RecipePage("dom-output"))
  .match(Router.Parse("/integrate/html-output"), RecipePage("html-output"))
  .match(Router.Parse("/integrate/react"), RecipePage("react"))
  .match(Router.Parse("/integrate/svelte"), RecipePage("svelte"))
  .match(Router.Parse("/integrate/vue"), RecipePage("vue"))
  .match(Router.Parse("/integrate/web-component"), RecipePage("web-component"))
  .match(Router.Parse("/reference"), Reference)
  .match(
    packageRoute,
    ({ id }) => Effect.option(loadPackage(decodeURIComponent(id))),
    Fx.switchMap(PackagePage),
  )
  .match(
    moduleRoute,
    ({ id }) => Effect.option(loadModule(decodeURIComponent(id))),
    Fx.switchMap(ModulePage),
  )
  .match(
    symbolRoute,
    ({ id }) => Effect.option(loadExposure(decodeURIComponent(id))),
    Fx.switchMap(({ symbol }) => SymbolPage(symbol)),
  )
  .match(Router.Parse("/glossary"), Glossary);

export const routes = appRoutes.layout(Layout);
