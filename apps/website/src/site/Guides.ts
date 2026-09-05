import type { CollectionEntry } from "astro:content";

const sections = [
  "Learning paths",
  "Fx",
  "State",
  "Async data",
  "Template authoring",
  "Template bindings",
  "Template rendering",
  "Template internals",
  "UI",
  "UI / Foundations",
  "UI / Forms",
  "UI / Collections",
  "UI / Overlays",
  "Routing",
  "Applications",
  "Integration",
];

export function groupGuides(guides: ReadonlyArray<CollectionEntry<"guides">>) {
  const groups = Map.groupBy(
    guides.toSorted((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id)),
    (entry) => entry.data.section,
  );
  const rank = (section: string) => {
    const index = sections.indexOf(section);
    return index === -1 ? sections.length : index;
  };
  return [...groups].sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
}

/** Public UI modules share their dedicated lesson across root and index re-exports. */
export function uiGuidePath(specifier: string): string | undefined {
  if (specifier === "@typed/ui" || specifier === "@typed/ui/index") return "/explore/ui";
  if (!specifier.startsWith("@typed/ui/")) return undefined;
  const module = specifier.slice("@typed/ui/".length);
  if (module === "Dom" || module.startsWith("Dom/")) return "/explore/ui-dom";
  const slug = module.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `/explore/ui-${slug}`;
}

// Each sequence starts with a prerequisite/entry and ends with a useful onward
// destination. Only the interior lessons receive navigation from that sequence.
// Catalog sections and order remain independent: adjacent topics are not always
// the next thing a learner needs (especially application versus library paths).
const readingPaths: ReadonlyArray<ReadonlyArray<string>> = [
  ["quick-start", "application-developers", "refsubject-renderer-independent-state"],
  ["application-developers", "library-developers", "shared-state-contracts"],
  ["quick-start", "ui", "ui-button"],
  [
    "application-developers",
    "fx-push-reactivity",
    "building-fx",
    "consuming-fx",
    "transforming-fx",
    "fx-stateful-transforms",
    "composing-fx",
    "fx-selection-and-cardinality",
    "fx-time-and-rate",
    "fx-higher-order-and-concurrency",
    "fx-errors-and-recovery",
    "fx-services-and-lifetime",
    "fx-dynamic-producers",
    "subject-event-publications",
    "sink-writing-effects",
    "fx-operator-atlas",
    "async-data",
  ],
  [
    "application-developers",
    "refsubject-renderer-independent-state",
    "refsubject-sources-equality-and-lifetime",
    "composing-refsubject-state",
    "derived-conditional-and-accumulated-state",
    "state-transactions-and-bidirectional-views",
    "specialized-refsubject-state",
    "versioned-state",
    "shared-state-contracts",
    "id",
    "async-data",
  ],
  ["hydrating-typed-html", "refsubject-template-hydration", "ui"],
  [
    "refsubject-renderer-independent-state",
    "async-data",
    "async-data-requests-and-cache",
    "async-data-optimistic-edits",
    "testing-typed-systems",
  ],
  [
    "quick-start",
    "render-your-first-template",
    "authoring-typed-templates",
    "renderable-normalization",
    "keyed-template-collections",
    "template-element-bindings",
    "dom-class-names",
    "template-spreads-data",
    "native-events-with-effect",
    "template-references-and-element-access",
    "template-namespaces-and-platform-markup",
    "template-text-only-contexts",
    "mounting-dom-output",
  ],
  [
    "render-your-first-template",
    "mounting-dom-output",
    "dom-updates-and-reconciliation",
    "dom-parts-and-attributes",
    "render-scheduling",
    "server-rendering-and-hydration",
    "rendering-html-on-the-server",
    "hydrating-typed-html",
    "refsubject-template-hydration",
  ],
  [
    "library-developers",
    "render-event-substrate",
    "dom-render-event",
    "wire-and-rendered-dom-output",
    "html-render-event",
    "implementing-render-template",
    "template-compilation-pipeline",
    "event-source-delegation",
    "cooperative-by-design",
  ],
  ["/explore", "cooperative-by-design", "quick-start"],
  [
    "application-developers",
    "routing-routes-matchers-and-navigation",
    "route-typed-url-inputs",
    "router-navigation-live-selection",
    "navigation-as-an-effect-service",
    "integrating-matcher-with-effect-http",
    "ui-http-router",
    "testing-typed-systems",
  ],
  ["route-typed-url-inputs", "guard", "router-navigation-live-selection"],
  ["application-developers", "testing-typed-systems", "tutorial"],
  [
    "ui",
    "choosing-ui-components",
    "building-ui-components",
    "ui-storybook",
    "testing-typed-systems",
  ],
  [
    "ui",
    "ui-button",
    "ui-link",
    "ui-checkbox",
    "ui-switch",
    "ui-radio-group",
    "forms-as-a-browser-contract",
    "ui-form",
    "ui-select",
    "ui-slider",
    "ui-spin-button",
    "choosing-ui-components",
  ],
  [
    "library-developers",
    "ui-component",
    "ui-dom",
    "ui-role",
    "ui-heading",
    "ui-group",
    "ui-separator",
    "ui-visually-hidden",
    "ui-alert",
    "ui-meter",
    "choosing-ui-components",
  ],
  [
    "ui",
    "ui-collections-and-focus",
    "ui-collection",
    "ui-focusable",
    "ui-composite",
    "selection-autocomplete-and-command-surfaces",
    "ui-listbox",
    "ui-combobox",
    "ui-menu",
    "ui-menubar",
    "ui-tabs",
    "ui-tab",
    "ui-toolbar",
    "ui-tree",
    "ui-grid",
    "ui-tree-grid",
    "ui-carousel",
    "ui-window-splitter",
    "choosing-ui-components",
  ],
  [
    "ui",
    "overlays-disclosure-and-transient-ui",
    "ui-disclosure",
    "ui-native-details",
    "ui-dialog",
    "ui-native-dialog",
    "ui-popover",
    "ui-native-popover",
    "ui-tooltip",
    "ui-hovercard",
    "choosing-ui-components",
  ],
];

export interface GuideLink {
  readonly href: string;
  readonly title: string;
}

const pageLinks: Readonly<Record<string, GuideLink>> = {
  "/explore": { href: "/explore", title: "Explore Typed" },
  "quick-start": { href: "/explore/quick-start", title: "Build a counter" },
  tutorial: { href: "/explore/tutorial", title: "Build TodoMVC one boundary at a time" },
  "/integrate": { href: "/integrate", title: "Choose an integration" },
};

export function guideNavigation(
  id: string,
  guides: ReadonlyArray<{ readonly id: string; readonly data: { readonly title: string } }>,
): { previous?: GuideLink; next?: GuideLink } {
  const path = readingPaths.find((path) => path.slice(1, -1).includes(id));
  if (!path) return {};
  const index = path.indexOf(id);
  const link = (destination: string): GuideLink => {
    const page = pageLinks[destination];
    if (page) return page;
    const guide = guides.find((guide) => guide.id === destination);
    if (!guide) throw new Error(`Unknown learning destination: ${destination}`);
    return { href: `/explore/${guide.id}`, title: guide.data.title };
  };
  return { previous: link(path[index - 1]!), next: link(path[index + 1]!) };
}
