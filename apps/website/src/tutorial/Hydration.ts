import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Effect, Layer } from "effect";
import { curriculumDemo } from "./Demos.js";

export const curriculumHydration = (document: Document): Layer.Layer<never> =>
  Layer.effectDiscard(
    Effect.gen(function* () {
      const hosts = [...document.querySelectorAll<HTMLElement>("[data-curriculum-demo]")];

      for (const host of hosts) {
        const id = host.dataset.curriculumDemo;
        const demo = id === undefined ? undefined : curriculumDemo(id);
        if (demo === undefined) {
          yield* Effect.logError(`Unknown curriculum demo: ${id ?? "<missing>"}`);
          continue;
        }

        yield* render(demo, host).pipe(
          Fx.drainLayer,
          Layer.provide(DomRenderTemplate.using(document)),
          Layer.launch,
          Effect.forkScoped,
        );
      }
    }),
  );
