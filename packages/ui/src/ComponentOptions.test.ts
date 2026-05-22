import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { describe, expectTypeOf, it } from "vitest";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import type { RenderTemplate } from "@typed/template";
import * as Dialog from "./Dialog.js";
import * as Disclosure from "./Disclosure.js";
import * as Tabs from "./Tabs.js";
import * as Toolbar from "./Toolbar.js";

class OptionError {
  readonly _tag = "OptionError";
}

class OptionService extends Context.Service<OptionService, { readonly label: string }>()(
  "typed/ui/test/OptionService",
) {}

describe("typed/ui component option inference", () => {
  it("preserves renderable error and service types from non-content options", () => {
    const disclosure = {} as RefSubject.RefSubject<Disclosure.State>;
    const dialog = {} as RefSubject.RefSubject<Dialog.State>;
    const tabs = {} as RefSubject.RefSubject<Tabs.State>;
    const toolbar = {} as RefSubject.RefSubject<Toolbar.State>;
    const label = Effect.flatMap(OptionService, () => Effect.fail(new OptionError()));

    const disclosureContent = Disclosure.Content({
      state: disclosure,
      id: label,
      content: "Panel",
    });
    const dialogContent = Dialog.Content({
      state: dialog,
      label,
      content: "Dialog",
    });
    const tabsList = Tabs.List({
      state: tabs,
      label,
      content: "Tabs",
    });
    const toolbarRoot = Toolbar.Root({
      state: toolbar,
      label,
      content: "Tools",
    });

    expectTypeOf<Fx.Error<typeof disclosureContent>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof dialogContent>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof tabsList>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof toolbarRoot>>().toEqualTypeOf<OptionError>();

    expectTypeOf<Fx.Services<typeof disclosureContent>>().toExtend<
      OptionService | RenderTemplate
    >();
    expectTypeOf<Fx.Services<typeof dialogContent>>().toExtend<OptionService | RenderTemplate>();
    expectTypeOf<Fx.Services<typeof tabsList>>().toExtend<OptionService | RenderTemplate>();
    expectTypeOf<Fx.Services<typeof toolbarRoot>>().toExtend<OptionService | RenderTemplate>();
  });
});
