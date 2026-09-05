import { Deferred, Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { describe, expect, it, vi } from "vitest";
import {
  DomRenderTemplate,
  html,
  HtmlRenderTemplate,
  render,
  renderToHtmlString,
} from "../../index.js";

export function sparseClassTests(createDocument: () => Document) {
  describe("sparse class concatenation", () => {
    for (const hydrate of [false, true]) {
      it(`joins authored segments before splitting tokens during ${hydrate ? "hydration" : "DOM rendering"} and updates`, () =>
        Effect.gen(function* () {
          const document = createDocument();
          const host = document.createElement("main");
          document.body.append(host);
          yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
          const kind = yield* RefSubject.make("input");
          const phase = yield* RefSubject.make("ready");
          const view = html`<div class="row row--${kind} status-${phase}-end"></div>`;
          const serialized = yield* view.pipe(
            renderToHtmlString,
            Effect.provide(HtmlRenderTemplate),
          );
          const reference = document.createElement("main");
          reference.innerHTML = serialized;
          const expectedInitial = ["row", "row--input", "status-ready-end"];
          expect(Array.from(reference.querySelector("div")!.classList)).toEqual(expectedInitial);
          let original: HTMLDivElement | null = null;
          if (hydrate) {
            host.innerHTML = serialized;
            original = host.querySelector("div")!;
            original.classList.add("external-before-hydration");
          }
          const mounted = yield* Deferred.make<void>();
          yield* render(view, host).pipe(
            Fx.provide(DomRenderTemplate.using(document)),
            Fx.observe(() => Deferred.succeed(mounted, undefined)),
            Effect.forkScoped,
          );
          yield* Deferred.await(mounted);
          const element = host.querySelector("div")!;
          if (hydrate) expect(element).toBe(original);
          const external = hydrate ? ["external-before-hydration"] : [];
          expect(Array.from(element.classList).sort()).toEqual(
            [...expectedInitial, ...external].sort(),
          );
          element.classList.add("external-after-mount");
          yield* RefSubject.set(kind, "output");
          yield* RefSubject.set(phase, "complete");
          yield* Effect.promise(() =>
            vi.waitFor(() => {
              expect(Array.from(element.classList).sort()).toEqual(
                [
                  "row",
                  "row--output",
                  "status-complete-end",
                  ...external,
                  "external-after-mount",
                ].sort(),
              );
            }),
          );
          expect(host.querySelector("div")).toBe(element);
        }).pipe(Effect.scoped, Effect.runPromise));
    }
  });
}
