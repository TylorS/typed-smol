import * as Tea from "./Tea.js";
import * as Counter from "./Counter.js";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Effect, Layer } from "effect";

const program = Tea.program(Counter.init, Counter.update, Counter.view);

await render(program, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
);
