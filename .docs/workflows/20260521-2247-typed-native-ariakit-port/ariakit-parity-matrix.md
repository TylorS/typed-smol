# Ariakit Parity Matrix

Current source baseline checked on 2026-05-23:

- Ariakit reference index: `https://ariakit.com/reference`, version shown as `v0.4.28`.
- Focused Ariakit pages checked for this pass: `Dialog`, `Tooltip`, and `Popover`.
- Typed source baseline: `packages/ui/src`.

Status legend:

- `implemented`: public Typed-native primitive exists with behavior coverage.
- `typed-native`: Ariakit capability exists through `RefSubject`, `Renderable`, `Schema`, Scope, host composition, or native platform APIs instead of React-specific hooks/stores.
- `intentional-divergence`: not a target for `@typed/ui`.
- `deferred`: useful future surface, but not needed for the current native-platform baseline.
- `removed-upstream`: Ariakit export is deprecated upstream and is not carried forward.

## Cross-Cutting Matrix

| Ariakit area | Typed equivalent | Status | Notes |
| --- | --- | --- | --- |
| React stores and hooks | `RefSubject.RefSubject`, `RefSubject.Service`, direct helpers | typed-native | Store/context APIs map to Typed state and Services instead of React hooks. |
| `store` prop | `state` option or ambient Service lookup | typed-native | Public APIs preserve `Opts extends {}` inference over renderable option values. |
| `render` prop / `as` replacement | `Dom.HostOptions<Element>.host` and `.props` | implemented | Host is the preferred composition path. User handlers/refs run first, then internal behavior. |
| Portal root | none | intentional-divergence | Native Popover/Dialog are the baseline; React portal APIs are not a parity target. |
| Data attributes | `DataAttr.schema`, `.data={object}`, `StartupRef` | implemented | Schema-backed encode/decode and startup hydration compose per primitive. |
| Collection/composite state | `Collection`, `Composite` | implemented | Scope-owned registration, roving tabindex, virtual focus, key movement, and typeahead helpers. |
| Native overlay | `NativePopover`, `NativeDialog` | implemented | Native `popover`/`dialog` APIs sync state and avoid custom positioning/focus engines. |
| Browser proof | `test:browser` | implemented | Covers native baselines plus rendered Popover, Dialog, Tooltip, Combobox, and Select form flows. Exhaustive APG path coverage remains a test-suite expansion goal. |

## Export Matrix

| Ariakit export(s) | Typed export(s) | Status | Notes |
| --- | --- | --- | --- |
| `Button`, `Command` | `Button.Button`, `Command.Command` | implemented | Native button/focusable command semantics with host-first composition. |
| `useCheckboxStore`, `useCheckboxContext`, `CheckboxProvider` | `Checkbox.makeState`, `State.Service` | typed-native | RefSubject state and Services replace React store/context APIs. |
| `Checkbox` | `Checkbox.Input`, `Checkbox.Checkbox` | implemented | Accessible input state, data attrs, nullable event support, host props. |
| `CheckboxCheck` | `Checkbox.Check` | implemented | Checked indicator with host replacement. |
| `Collection`, `CollectionItem`, `CollectionProvider`, collection hooks | `Collection.makeState`, `Collection.register`, component item registration | typed-native | Registration is Scope-owned and unregisters on Scope close. |
| `useComboboxStore`, `useComboboxContext`, `ComboboxProvider` | `Combobox.makeState`, `State.Service` | typed-native | RefSubject state and Services. |
| `Combobox` | `Combobox.Input` | implemented | Input/listbox linkage, active descendant, autocomplete/filtering, async/static item sources. |
| `ComboboxCancel` | `Combobox.Cancel` | implemented | Clears input value through state. |
| `ComboboxDisclosure` | `Combobox.Disclosure` | implemented | Native popover disclosure button. |
| `ComboboxGroup`, `ComboboxGroupLabel` | `Combobox.Group`, `Combobox.GroupLabel` | implemented | Group labeling surface. |
| `ComboboxItem` | `Combobox.Item` | implemented | Option registration, selection, active item state, data attrs. |
| `ComboboxItemCheck` | `Combobox.ItemCheck` | implemented | Selection indicator. |
| `ComboboxItemValue` | `Combobox.ItemValue` | implemented | Value rendering hook point; Ariakit substring decoration is not copied as React-specific structure. |
| `ComboboxLabel` | `Combobox.Label` | implemented | Label host. |
| `ComboboxList`, `ComboboxPopover` | `Combobox.List`, `Combobox.Popover` | implemented | Listbox role and native Popover layering. |
| `ComboboxRow` | `Combobox.Row` | implemented | Row host surface for two-dimensional composition. |
| `ComboboxSeparator` | `Combobox.Separator` | removed-upstream | Ariakit marks this deprecated; prefer groups/borders. |
| `ComboboxValue` | `Combobox.Value` | implemented | Current value rendering. |
| `Composite`, `CompositeItem`, `CompositeProvider`, composite hooks | `Composite.makeState`, `Composite.move`, item-level wiring in widgets | typed-native | Reusable engine rather than public React component wrappers. |
| `CompositeGroup`, `CompositeGroupLabel`, `CompositeRow`, `CompositeSeparator` | `Group`, widget group/row/separator exports | implemented | Structural surfaces exist where the owning widget needs them. |
| `CompositeHover` | host/event composition plus `Composite.move` | typed-native | Behavior is composed directly at item boundaries. |
| `CompositeTypeahead` | `Composite.typeahead`, `Composite.typeaheadFromEvent` | typed-native | Component-level wiring exists in composite widgets. |
| `useDialogStore`, `useDialogContext`, `DialogProvider` | `Dialog.makeState`, `State.Service` | typed-native | RefSubject state and Services. |
| `Dialog` | `Dialog.Content`, `Dialog.Dialog` | implemented | Native `<dialog>`, modal/non-modal, initial/final focus, Escape/outside close policies, close sync. |
| `DialogDisclosure` | `Dialog.Trigger`, `Dialog.Disclosure` | implemented | Invoker tracking and ARIA controls. |
| `DialogDismiss` | `Dialog.Close`, `Dialog.Dismiss` | implemented | Close button state sync. |
| `DialogHeading`, `DialogDescription` | `Dialog.Heading`, `Dialog.Description` | implemented | Label/description hosts. |
| `useDisclosureStore`, `useDisclosureContext`, `DisclosureProvider` | `Disclosure.makeState`, `State.Service` | typed-native | RefSubject state and Services. |
| `Disclosure`, `DisclosureContent` | `Disclosure.Button`, `Disclosure.Content` | implemented | Button/content APG attributes and public data state. |
| `FocusTrap`, `FocusTrapRegion` | none | intentional-divergence | Deprecated in this port; native `<dialog>` owns modal focus. |
| `Focusable` | `Focusable.Focusable` | implemented | Focusable host primitive. |
| `useFormStore`, `useFormContext`, `FormProvider` | `Form.makeState`, `State.Service` | typed-native | Typed form state and schema lifecycle. |
| `Form` | `Form.Form` | implemented | Schema validation, submit/reset lifecycle, field metadata. |
| `FormInput`, `FormControl`, `FormField` | `Form.Input`, `Form.Control`, `Form.Field` | implemented | `FormField` is preserved only as a local alias because the package is pre-release. |
| `FormCheckbox`, `FormRadio`, `FormRadioGroup` | `Form.Checkbox`, `Form.Radio`, `Form.RadioGroup` | implemented | Typed field aliases over the common control/group primitives. |
| `FormDescription`, `FormError`, `FormLabel` | `Form.Description`, `Form.Error`, `Form.Label` | implemented | Field metadata/error display. |
| `FormGroup`, `FormGroupLabel` | `Form.Group`, `Form.GroupLabel` | implemented | Group labeling. |
| `FormPush`, `FormRemove` | `Form.Push`, `Form.Remove` | implemented | Type-checks only against array-valued field names. |
| `FormReset`, `FormSubmit` | `Form.Reset`, `Form.Submit` | implemented | Reset and submit controls. |
| `Group`, `GroupLabel` | `Group.Group`, `Group.Label` | implemented | Structural group primitives. |
| `Heading`, `HeadingLevel` | `Heading.Heading`, `Heading.Level`, `Heading.HeadingLevel` | implemented | Heading level host surface. |
| `useHovercardStore`, `useHovercardContext`, `HovercardProvider` | `Hovercard.makeState`, `State.Service` | typed-native | RefSubject state and Services. |
| `Hovercard`, `HovercardAnchor`, `HovercardDisclosure` | `Hovercard.Content`, `Hovercard.Anchor`, `Hovercard.Disclosure` | implemented | Native popover lifecycle. |
| `HovercardArrow`, `HovercardDismiss`, `HovercardHeading`, `HovercardDescription` | `Hovercard.Arrow`, `Hovercard.Dismiss`, `Hovercard.Heading`, `Hovercard.Description` | implemented | Interactive hovercard subparts. |
| `useMenuStore`, `useMenuContext`, `MenuProvider` | `Menu.makeState`, `State.Service` | typed-native | RefSubject state and Services. |
| `Menu`, `MenuList` | `Menu.Content`, `Menu.Menu`, `Menu.List` | implemented | Native popover menu content and APG roles. |
| `MenuButton` | `Menu.Trigger`, `Menu.Button` | implemented | Button/ARIA/open state. |
| `MenuArrow`, `MenuButtonArrow` | `Menu.MenuArrow`, `Menu.MenuButtonArrow`, aliases | implemented | Hostable arrow surfaces. |
| `MenuItem`, `MenuItemCheckbox`, `MenuItemRadio` | `Menu.Item`, `Menu.ItemCheckbox`, `Menu.ItemRadio` | implemented | Shared item behavior, checkbox/radio roles, close-on-select path. |
| `MenuItemCheck` | `Menu.ItemCheck` | implemented | Checked indicator. |
| `MenuGroup`, `MenuGroupLabel` | `Menu.Group`, `Menu.GroupLabel` | implemented | Group labeling. |
| `MenuHeading`, `MenuDescription` | `Menu.Heading`, `Menu.Description` | implemented | Label/description subparts. |
| `MenuDismiss` | `Menu.Dismiss` | implemented | Close button state sync. |
| `MenuSeparator` | `Menu.Separator` | implemented | Separator host. |
| `MenuBar`, `MenuBarProvider`, `useMenuBarStore`, `useMenuBarContext` | none | removed-upstream | Ariakit marks these deprecated; `Menubar` spelling is used. |
| `useMenubarStore`, `useMenubarContext`, `MenubarProvider` | `Menubar.makeState`, `State.Service` | typed-native | RefSubject state and Services. |
| `Menubar` | `Menubar.Root`, `Menubar.Menubar` | implemented | Composite-backed menubar. |
| `Popover`, `PopoverAnchor`, `PopoverDisclosure` | `Popover.Content`, `Popover.Anchor`, `Popover.Trigger` | implemented | Native popover attributes, toggle sync, anchor positioning. |
| `PopoverArrow`, `PopoverDisclosureArrow`, `PopoverDismiss`, `PopoverHeading`, `PopoverDescription` | `Popover.Arrow`, `Popover.DisclosureArrow`, `Popover.Dismiss`, `Popover.Heading`, `Popover.Description` | implemented | Hostable popover subparts. |
| `usePopoverStore`, `usePopoverContext`, `PopoverProvider` | `Popover.makeState`, `State.Service` | typed-native | RefSubject state and Services. |
| `Portal`, `PortalContext`, portal props | none | intentional-divergence | Native overlay baseline replaces React portal APIs. |
| `Radio`, `RadioGroup`, `RadioProvider`, radio hooks | `Radio` module, `RadioGroup.Root`, `RadioGroup.Item`, `State.Service` | implemented | Radio group state, item selection, composite movement. |
| `Role` | `Role.Role` | implemented | Abstract host wrapper. |
| `Select`, `SelectPopover`, `SelectList` | `Select.Trigger`, `Select.Content`, `Select.Popover`, `Select.List` | implemented | Native popover listbox and hidden input/Form sync. |
| `SelectArrow`, `SelectDismiss`, `SelectHeading`, `SelectLabel`, `SelectValue` | `Select.Arrow`, `Select.Dismiss`, `Select.Heading`, `Select.Label`, `Select.Value` | implemented | Hostable select subparts. |
| `SelectItem`, `SelectItemCheck`, `SelectGroup`, `SelectGroupLabel`, `SelectRow` | `Select.Option`, `Select.Item`, `Select.ItemCheck`, `Select.Group`, `Select.GroupLabel`, `Select.Row` | implemented | Option selection, active movement, typeahead, selected attrs. |
| `SelectSeparator` | `Select.Separator` | removed-upstream | Ariakit marks this deprecated; local alias remains for pre-release compatibility only. |
| `useSelectStore`, `useSelectContext`, `SelectProvider` | `Select.makeState`, `State.Service` | typed-native | RefSubject state and Services. |
| `Separator` | `Separator.Separator` | implemented | Structural separator primitive. |
| `useStoreState` | `Store`/`RefSubject` helpers | typed-native | State reads use RefSubject and computed values. |
| `Tab`, `TabList`, `TabPanel`, tab hooks/provider | `Tabs.Tab`, `Tabs.List`, `Tabs.Panel`, `Tabs.makeState`, `State.Service` | implemented | Automatic/manual activation, relationships, keyboard movement. |
| `Toolbar`, `ToolbarItem`, `ToolbarContainer`, `ToolbarSeparator`, toolbar hooks/provider | `Toolbar.Root`, `Toolbar.Item`, `Toolbar.Container`, `Toolbar.Separator`, `State.Service` | implemented | Composite-backed toolbar. |
| `ToolbarInput` | none | removed-upstream | Ariakit marks this deprecated; host an input through `Toolbar.Item`. |
| `Tooltip`, `TooltipAnchor`, `TooltipArrow`, tooltip hooks/provider | `Tooltip.Content`, `Tooltip.Anchor`, `Tooltip.Arrow`, `Tooltip.makeState`, `State.Service` | implemented | Native hint popover, focus/hover lifecycle, show/hide delay, hover grace. |
| `VisuallyHidden` | `VisuallyHidden.VisuallyHidden` | implemented | Screen-reader-only host primitive. |

## Prop And Behavior Matrix

| Ariakit prop/behavior | Typed surface | Status | Notes |
| --- | --- | --- | --- |
| `open`, `onClose` store control | `state`, `setOpen`, `close`, native toggle/close sync | implemented | State remains public `RefSubject`. |
| `modal` | `Dialog.Content({ modal })` | implemented | `false` uses native `show()` where available. |
| `initialFocus`, `finalFocus` | `Dialog.Content({ initialFocus, finalFocus })` | implemented | Accepts selector, element, or resolver callback. |
| `hideOnEscape` | `Dialog.Content({ closeOnEscape })` | implemented | `false` prevents native cancel close. |
| `hideOnInteractOutside` | `Dialog.Content({ closeOnOutsideInteraction })` | implemented | Uses native dialog backdrop click policy. |
| `autoFocus*`, `preventBodyScroll`, portal focus preservation props | native dialog behavior | intentional-divergence | These are React/custom-overlay concerns. |
| `popover` placement/anchor | `anchorName`, `positionAnchor`, `positionArea`, data attrs | implemented | Native CSS Anchor Positioning only; no JS positioning engine. |
| Popover toggle lifecycle | `beforetoggle`/`toggle` state sync through native element refs | implemented | Browser tests cover rendered toggle sync. |
| Menu/select/listbox keyboard movement | `items`, `orientation`, `loop`, `rtl`, `Composite.moveByKey` wiring | implemented | Composite-backed. |
| Typeahead | `textValue`, `Composite.typeaheadFromEvent`, component handlers | implemented | Wired into composite widgets. |
| Disabled/focusable policy | `disabled`, `focusable`, item data attrs | implemented | Disabled items are tracked and can remain focusable where widget policy allows. |
| `aria-activedescendant` virtual focus | `Composite.activeDescendant` | implemented | Used by listbox/select/combobox paths. |
| Combobox filtering/autocomplete | `items`, `filter`, `autocomplete`, `autoSelect` | implemented | Sources can be static or renderable/Fx/Stream values. |
| Select form participation | `Select.HiddenInput({ name, formState })` | implemented | Browser test proves `FormData` submission. |
| Form schema validation | `Form.makeState({ schema })`, `validate`, codecs | implemented | Schema DOM encode/decode helpers and lifecycle hooks are public. |
| Array push/remove | `Form.Push`, `Form.Remove`, `pushValue`, `removeValue` | implemented | Type constrained to array-valued fields. |

## Remaining Evidence Gaps

- The matrix is now export-level and prop/behavior-level, but browser coverage is intentionally not yet exhaustive APG-grade coverage for every keyboard/focus/overlay path.
- Docs/examples still need more per-component recipes before the package should be described as documentation-complete.
