import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";
import * as State from "./State.js";

describe("typed/ui/State", () => {
  it("creates a service tag for a RefSubject state", () =>
    Effect.gen(function* () {
      const DialogState = State.tag<{ open: boolean }>("dialog-test");
      const ref = yield* RefSubject.make({ open: true });
      const value = yield* DialogState.pipe(Effect.provideService(DialogState, ref));

      expect(yield* value).toEqual({ open: true });
    }).pipe(Effect.scoped, Effect.runPromise));
});
