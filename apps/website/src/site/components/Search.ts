import * as Component from "@typed/astro/Component";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { EventHandler, html, many } from "@typed/template";
import * as Button from "@typed/ui/Button";
import * as Dialog from "@typed/ui/Dialog";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { searchDocumentation, type SearchArtifact, type SearchResult } from "../../docs/Search.js";
import { siteHref } from "../../SiteHref.js";

const Artifact = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  entries: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      title: Schema.String,
      kind: Schema.Literals(["package", "module", "exposure", "resource", "guide", "glossary"]),
      text: Schema.String,
      href: Schema.String,
      canonicalId: Schema.optional(Schema.String),
      declarationKey: Schema.optional(Schema.String),
      specifier: Schema.optional(Schema.String),
    }),
  ),
  prefixes: Schema.Record(Schema.String, Schema.Array(Schema.Number)),
  trigrams: Schema.Record(Schema.String, Schema.Array(Schema.Number)),
});

interface Results {
  readonly message: string;
  readonly entries: ReadonlyArray<SearchResult>;
}

/** A native modal whose query subscription and requests belong to its Typed island Scope. */
export default Component.make(() =>
  Effect.gen(function* () {
    const state = yield* Dialog.makeState();
    const query = yield* RefSubject.make("");
    const results = yield* RefSubject.make<Results>({
      message: "Search guides, packages, and API reference.",
      entries: [],
    });
    let artifact: SearchArtifact | undefined;

    const search = ([dialog, value]: readonly [Dialog.State, string]) =>
      Effect.gen(function* () {
        const term = value.trim();
        if (!dialog.open || !term) {
          yield* RefSubject.set(results, {
            message: "Search guides, packages, and API reference.",
            entries: [],
          });
          return;
        }
        yield* RefSubject.set(results, { message: "Searching…", entries: [] });
        const loaded =
          artifact === undefined
            ? yield* Effect.tryPromise({
                try: async (signal) => {
                  const response = await fetch(siteHref("/search-index.json"), { signal });
                  if (!response.ok) throw new Error(`Search index returned ${response.status}`);
                  const data: unknown = await response.json();
                  return Schema.decodeUnknownSync(Artifact)(data);
                },
                catch: () =>
                  "Search is unavailable. Please try another query or try again later." as const,
              }).pipe(
                Effect.match({
                  onFailure: (message) => ({ message, artifact: undefined }),
                  onSuccess: (index) => ({ message: "", artifact: index }),
                }),
              )
            : { message: "", artifact };
        if (loaded.artifact === undefined) {
          yield* RefSubject.set(results, { message: loaded.message, entries: [] });
          return;
        }
        artifact = loaded.artifact;
        const entries = searchDocumentation(artifact, term, 12);
        yield* RefSubject.set(results, {
          message:
            entries.length === 0
              ? `No results for “${term}”.`
              : `${entries.length} results for “${term}”.`,
          entries,
        });
      });

    const attach = Effect.fn(function* (element: HTMLElement) {
      const document = element.ownerDocument;
      const keydown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
          event.preventDefault();
          Effect.runFork(Dialog.setOpen(state, true));
        }
      };
      document.addEventListener("keydown", keydown);
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => document.removeEventListener("keydown", keydown)),
      );
      yield* Effect.forkScoped(Fx.drain(Fx.switchMapEffect(Fx.tuple(state, query), search)));
    });

    return html`<div ref=${attach}>
      ${Button.Button({
        content: html`<span>Search docs</span><kbd>⌘ K</kbd>`,
        onclick: Dialog.setOpen(state, true),
        props: {
          class: "search-trigger btn btn-ghost",
          "aria-haspopup": "dialog",
          "aria-controls": "docs-search",
          "aria-expanded": RefSubject.map(state, ({ open }) => open),
        },
      })}
      ${Dialog.Content({
        state,
        id: "docs-search",
        labelledBy: "docs-search-title",
        props: { class: "search-dialog" },
        content: html`<div class="search-dialog-header">
            <h2 id="docs-search-title">Search documentation</h2>
            ${Button.Button({ content: "Close", onclick: Dialog.close(state), props: { class: "btn btn-ghost btn-sm" } })}
          </div>
          <label class="search-label" for="docs-search-query">Search docs</label>
          <input
            id="docs-search-query"
            class="input input-bordered w-full"
            type="search"
            placeholder="Try RefSubject, hydration, or routing"
            autocomplete="off"
            autofocus
            .value=${query}
            @input=${EventHandler.make((event: Event) => (event.currentTarget instanceof HTMLInputElement ? RefSubject.set(query, event.currentTarget.value) : Effect.void))}
          />
          <div class="search-results">
            <p role="status" aria-live="polite">
              ${RefSubject.map(results, ({ message }) => message)}
            </p>
            <ul>
              ${many(
                RefSubject.map(results, ({ entries }) => entries),
                (entry) => entry.id,
                (entry) => html`<li>
                  <a
                    href=${RefSubject.map(entry, (value) => siteHref(value.href))}
                    @click=${Dialog.close(state)}
                  >
                    <strong>${RefSubject.map(entry, (value) => value.title)}</strong
                    ><small
                      >${RefSubject.map(entry, (value) => value.specifier ?? value.kind)}</small
                    >
                  </a>
                </li>`,
              )}
            </ul>
          </div>`,
      })}
    </div>`;
  }),
);
