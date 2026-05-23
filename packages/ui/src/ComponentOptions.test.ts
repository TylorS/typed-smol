import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { describe, expectTypeOf, it } from "vitest";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import type { RenderTemplate } from "@typed/template";
import * as Dialog from "./Dialog.js";
import * as Disclosure from "./Disclosure.js";
import * as Form from "./Form.js";
import * as Listbox from "./Listbox.js";
import * as Menu from "./Menu.js";
import * as Select from "./Select.js";
import * as RadioGroup from "./RadioGroup.js";
import type * as Reactive from "./Reactive.js";
import * as Tabs from "./Tabs.js";
import * as Toolbar from "./Toolbar.js";
import * as DataAttr from "./DataAttr.js";
import * as StartupRef from "./StartupRef.js";
import { Scope } from "effect";

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
    const listbox = {} as RefSubject.RefSubject<Listbox.State<string>>;
    const menu = {} as RefSubject.RefSubject<Menu.State>;
    const radioGroup = {} as RefSubject.RefSubject<RadioGroup.State<string>>;
    const select = {} as RefSubject.RefSubject<Select.State<string>>;
    const tabs = {} as RefSubject.RefSubject<Tabs.State>;
    const toolbar = {} as RefSubject.RefSubject<Toolbar.State>;
    const label = Effect.flatMap(OptionService, () => maybeOptionError("option"));
    const value = Effect.flatMap(OptionService, () => maybeOptionError("value"));
    const disabled = Effect.flatMap(OptionService, () => maybeOptionError(false));

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
    const menuContent = Menu.Content({
      state: menu,
      label,
      content: "Menu",
    });
    const listboxRoot = Listbox.Root({
      state: listbox,
      label,
      content: "Listbox",
    });
    const selectContent = Select.Content({
      state: select,
      label,
      content: "Select",
    });
    const listboxOption = Listbox.Option({
      state: listbox,
      id: label,
      value,
      disabled,
      content: "Option",
    });
    const menuItem = Menu.Item({
      state: menu,
      id: label,
      disabled,
      content: "Item",
    });
    const selectOption = Select.Option({
      state: select,
      id: label,
      value,
      disabled,
      content: "Option",
    });
    const radioItem = RadioGroup.Item({
      state: radioGroup,
      id: label,
      value,
      content: "Radio",
    });
    const tabsList = Tabs.List({
      state: tabs,
      label,
      content: "Tabs",
    });
    const tabsTab = Tabs.Tab({
      state: tabs,
      id: label,
      panelId: label,
      content: "Tab",
    });
    const tabsPanel = Tabs.Panel({
      state: tabs,
      id: label,
      tabId: label,
      content: "Panel",
    });
    const toolbarRoot = Toolbar.Root({
      state: toolbar,
      label,
      content: "Tools",
    });

    expectTypeOf<Fx.Error<typeof disclosureContent>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof dialogContent>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof listboxRoot>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof listboxOption>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof menuContent>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof menuItem>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof selectContent>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof selectOption>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof radioItem>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof tabsList>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof tabsTab>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof tabsPanel>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Error<typeof toolbarRoot>>().toEqualTypeOf<OptionError>();

    expectTypeOf<Fx.Services<typeof disclosureContent>>().toExtend<
      OptionService | RenderTemplate | Scope.Scope
    >();
    expectTypeOf<Fx.Services<typeof dialogContent>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof listboxRoot>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof listboxOption>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof menuContent>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof menuItem>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof selectContent>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof selectOption>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof radioItem>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof tabsList>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof tabsTab>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof tabsPanel>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
    expectTypeOf<Fx.Services<typeof toolbarRoot>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
  });

  it("exposes ref-first component source and return types", () => {
    const select = {} as RefSubject.RefSubject<Select.State<string>>;
    const ref = {} as RefSubject.RefSubject<string, OptionError, OptionService>;
    const options = {
      state: select,
      id: ref,
      value: ref,
      content: ref,
    };

    const option = Select.Option(options);

    expectTypeOf<typeof ref>().toExtend<Reactive.Value<string, OptionError, OptionService>>();
    expectTypeOf<typeof option>().toExtend<Reactive.Component<typeof options>>();
  });

  it("limits StartupRef data hydration to fields in the backing state", () => {
    const state = {} as RefSubject.RefSubject<{ readonly open: boolean }>;

    StartupRef.fromData(state, DataAttr.schema({ open: Schema.Boolean }));

    // @ts-expect-error placement is not part of the backing state
    StartupRef.fromData(state, DataAttr.schema({ placement: Schema.String }));
  });

  it("keeps form field names keyed to the backing values object", () => {
    const form = {} as RefSubject.RefSubject<
      Form.State<{
        readonly email: string;
        readonly password: string;
      }>
    >;

    Form.Input({ state: form, name: "email" });
    Form.Error({ state: form, name: "password" });

    // @ts-expect-error missing is not a field in the backing form state
    Form.Input({ state: form, name: "missing" });
    // @ts-expect-error missing is not a field in the backing form state
    Form.Error({ state: form, name: "missing" });
  });
});

function maybeOptionError<A>(value: A): Effect.Effect<A, OptionError> {
  return Effect.suspend(() =>
    Math.random() >= 0 ? Effect.succeed(value) : Effect.fail(new OptionError()),
  );
}
