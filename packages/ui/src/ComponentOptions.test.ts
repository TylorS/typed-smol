import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { describe, expectTypeOf, it } from "vitest";
import type { Fx } from "@typed/fx/Fx";
import { RefSubject } from "@typed/fx";
import { EventHandler, type RenderTemplate } from "@typed/template";
import * as Button from "./Button.js";
import * as Combobox from "./Combobox.js";
import * as Dialog from "./Dialog.js";
import * as Disclosure from "./Disclosure.js";
import * as Dom from "./Dom.js";
import * as Form from "./Form.js";
import * as Listbox from "./Listbox.js";
import * as Menu from "./Menu.js";
import * as Select from "./Select.js";
import * as RadioGroup from "./RadioGroup.js";
import type * as Reactive from "./Reactive.js";
import * as Tabs from "./Tabs.js";
import * as Tooltip from "./Tooltip.js";
import * as Toolbar from "./Toolbar.js";
import * as DataAttr from "./DataAttr.js";
import * as StartupRef from "./StartupRef.js";
import { Scope } from "effect";

class OptionError {
  readonly _tag = "OptionError";
}

class StateError {
  readonly _tag = "StateError";
}

class OptionService extends Context.Service<OptionService, { readonly label: string }>()(
  "typed/ui/test/OptionService",
) {}

class StateService extends Context.Service<StateService, { readonly state: string }>()(
  "typed/ui/test/StateService",
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

  it("preserves RefSubject state error and service channels", () => {
    const dialog = {} as RefSubject.RefSubject<Dialog.State, StateError, StateService>;
    const listbox = {} as RefSubject.RefSubject<Listbox.State<string>, StateError, StateService>;
    const menu = {} as RefSubject.RefSubject<Menu.State, StateError, StateService>;
    const select = {} as RefSubject.RefSubject<Select.State<string>, StateError, StateService>;
    const tabs = {} as RefSubject.RefSubject<Tabs.State, StateError, StateService>;

    const dialogContent = Dialog.Content({ state: dialog, label: "Dialog", content: "Dialog" });
    const listboxRoot = Listbox.Root({ state: listbox, content: "Listbox" });
    const menuContent = Menu.Content({ state: menu, content: "Menu" });
    const selectContent = Select.Content({ state: select, content: "Select" });
    const tabsList = Tabs.List({ state: tabs, content: "Tabs" });

    expectTypeOf<Fx.Error<typeof dialogContent>>().toExtend<StateError>();
    expectTypeOf<Fx.Error<typeof listboxRoot>>().toExtend<StateError>();
    expectTypeOf<Fx.Error<typeof menuContent>>().toExtend<StateError>();
    expectTypeOf<Fx.Error<typeof selectContent>>().toExtend<StateError>();
    expectTypeOf<Fx.Error<typeof tabsList>>().toExtend<StateError>();

    expectTypeOf<Fx.Services<typeof dialogContent>>().toExtend<
      StateService | RenderTemplate | Scope.Scope
    >();
    expectTypeOf<Fx.Services<typeof listboxRoot>>().toExtend<
      StateService | RenderTemplate | Scope.Scope
    >();
    expectTypeOf<Fx.Services<typeof menuContent>>().toExtend<
      StateService | RenderTemplate | Scope.Scope
    >();
    expectTypeOf<Fx.Services<typeof selectContent>>().toExtend<
      StateService | RenderTemplate | Scope.Scope
    >();
    expectTypeOf<Fx.Services<typeof tabsList>>().toExtend<
      StateService | RenderTemplate | Scope.Scope
    >();
  });

  it("preserves RefSubject state channels through state helper effects", () => {
    const dialog = {} as RefSubject.RefSubject<Dialog.State, StateError, StateService>;
    const menu = {} as RefSubject.RefSubject<Menu.State, StateError, StateService>;
    const select = {} as RefSubject.RefSubject<Select.State<string>, StateError, StateService>;

    expectTypeOf(Dialog.setOpen(dialog, true)).toEqualTypeOf<
      Effect.Effect<Dialog.State, StateError, StateService>
    >();
    expectTypeOf(Menu.setOpen(menu, true)).toEqualTypeOf<
      Effect.Effect<Menu.State, StateError, StateService>
    >();
    expectTypeOf(Select.setOpen(select, true)).toEqualTypeOf<
      Effect.Effect<Select.State<string>, StateError, StateService>
    >();
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

  it("exposes named broad renderable aliases without erasing actual option inference", () => {
    const value = Effect.flatMap(OptionService, () => maybeOptionError("value"));
    const option = Select.Option({
      state: {} as RefSubject.RefSubject<Select.State<string>>,
      id: value,
      value,
      content: value,
    });

    expectTypeOf<typeof value>().toExtend<Reactive.AnyValue<string>>();
    expectTypeOf<typeof value>().toExtend<Reactive.AnyContent<string>>();
    expectTypeOf<Reactive.ErrorOf<typeof value>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Reactive.ServicesOf<typeof value>>().toEqualTypeOf<OptionService>();
    expectTypeOf<Reactive.ErrorFromOptions<{ readonly value: typeof value }>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Reactive.ServicesFromOptions<{ readonly value: typeof value }>>().toEqualTypeOf<OptionService>();
    expectTypeOf<Fx.Error<typeof option>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Services<typeof option>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
  });

  it("preserves errors and services from host props, refs, events, and host renderers", () => {
    const hostId = Effect.flatMap(OptionService, () => maybeOptionError("save"));
    const props = {
      id: hostId,
      onclick: EventHandler.make((event: MouseEvent) =>
        Effect.flatMap(OptionService, () => maybeOptionError(event.type)),
      ),
      ref: () => Effect.flatMap(OptionService, () => maybeOptionError(undefined)),
    } satisfies Dom.HostProps<HTMLButtonElement>;
    const button = Button.Button({
      content: "Save",
      props,
      host: (_props, content) => Effect.flatMap(OptionService, () => maybeOptionError(content)),
    });

    expectTypeOf<Fx.Error<typeof button>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Services<typeof button>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
  });

  it("preserves errors and services from component callbacks", () => {
    const formState = {} as RefSubject.RefSubject<Form.State<{ readonly email: string }>>;
    const form = Form.Form({
      state: formState,
      content: "Save",
      onValidSubmit: (values) =>
        Effect.flatMap(OptionService, () => maybeOptionError(values.email)),
    });

    expectTypeOf<Fx.Error<typeof form>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Services<typeof form>>().toExtend<OptionService | RenderTemplate | Scope.Scope>();
  });

  it("keeps user-provided renderable values broad while deriving their concrete channels", () => {
    const items = Effect.flatMap(OptionService, () =>
      maybeOptionError<readonly Combobox.Item[]>([{ id: "apple", value: "apple" }]),
    );
    const delay = Effect.flatMap(OptionService, () => maybeOptionError(20));
    const tooltip = Tooltip.Anchor({
      state: {} as RefSubject.RefSubject<Tooltip.State>,
      content: "Help",
      showDelay: delay,
    });
    const combobox = Combobox.Input({
      state: {} as RefSubject.RefSubject<Combobox.State>,
      items,
    });

    expectTypeOf<typeof items>().toExtend<Reactive.AnyValue<readonly Combobox.Item[]>>();
    expectTypeOf<typeof delay>().toExtend<Reactive.AnyValue<number | undefined>>();
    expectTypeOf<Fx.Error<typeof tooltip | typeof combobox>>().toEqualTypeOf<OptionError>();
    expectTypeOf<Fx.Services<typeof tooltip | typeof combobox>>().toExtend<
      OptionService | RenderTemplate | Scope.Scope
    >();
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

  it("limits form push and remove to array field names", () => {
    const form = {} as RefSubject.RefSubject<
      Form.State<{
        readonly email: string;
        readonly tags: readonly string[];
      }>
    >;

    Form.Push({ state: form, name: "tags", value: "typed", content: "Add" });
    Form.Remove({ state: form, name: "tags", index: 0, content: "Remove" });

    // @ts-expect-error email is not an array field
    Form.Push({ state: form, name: "email", value: "typed", content: "Add" });
    // @ts-expect-error email is not an array field
    Form.Remove({ state: form, name: "email", index: 0, content: "Remove" });
  });
});

function maybeOptionError<A>(value: A): Effect.Effect<A, OptionError> {
  return Effect.suspend(() =>
    Math.random() >= 0 ? Effect.succeed(value) : Effect.fail(new OptionError()),
  );
}
