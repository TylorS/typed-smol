import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * Native button submission behavior.
 *
 * @remarks
 * ## Why
 *
 * The union exposes the exact HTML button types and defaults components to the
 * non-submitting `button` behavior.
 *
 * ## Ownership and lifetime
 *
 * This is a pure type and acquires no resources.
 *
 * @since 1.0.0
 * @category models
 */
export type ButtonType = "button" | "submit" | "reset";

/**
 * Renderable state and host options for a native button.
 *
 * @remarks
 * ## Why
 *
 * The model keeps native button semantics while allowing content, disabled
 * state, and handlers to come from any Typed renderable source.
 *
 * ## Ownership and lifetime
 *
 * The options are inert. The rendered component's Scope owns dynamic option
 * subscriptions and listener cleanup.
 *
 * @since 1.0.0
 * @category models
 */
export interface ButtonOptions extends Dom.HostOptions<HTMLButtonElement> {
  /**
   * The button's visible and accessible content.
   *
   * @remarks
   * ## Why
   *
   * Native content supplies the accessible name unless the host explicitly
   * provides another naming mechanism.
   *
   * ## Ownership and lifetime
   *
   * Dynamic content is subscribed to only while the component Scope is open.
   *
   * @since 1.0.0
   * @category content
   */
  readonly content: Renderable.Any;
  /**
   * The native `type` attribute; defaults to `"button"`.
   *
   * @remarks
   * ## Why
   *
   * An explicit non-submitting default prevents a reusable button from
   * accidentally submitting an enclosing form.
   *
   * ## Ownership and lifetime
   *
   * The value is reflected by the renderer and retains no resources.
   *
   * @since 1.0.0
   * @category attributes
   */
  readonly type?: Renderable.Any<ButtonType | null | undefined>;
  /**
   * Whether the native control is disabled.
   *
   * @remarks
   * ## Why
   *
   * Using the native disabled state removes the button from interaction and
   * form submission according to browser semantics.
   *
   * ## Ownership and lifetime
   *
   * Dynamic values are observed for the component Scope and then released.
   *
   * @since 1.0.0
   * @category attributes
   */
  readonly disabled?: Renderable.Any<boolean | null | undefined>;
  /**
   * A real DOM click handler supplied by the consumer.
   *
   * @remarks
   * ## Why
   *
   * `Button` has no internal activation handler. The supplied handler receives
   * the real DOM click event; browser default actions remain native.
   *
   * ## Ownership and lifetime
   *
   * Rendering installs the listener and the component Scope removes it.
   *
   * @since 1.0.0
   * @category events
   */
  readonly onclick?: Dom.EventHandlerInput<Dom.EventOf<HTMLButtonElement["onclick"]>>;
}

function internalProps<const Options extends ButtonOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return {
    type: property("type", "button"),
    "?disabled": property("disabled", false),
  };
}

type ButtonInternalProps<Options extends ButtonOptions> = ReturnType<typeof internalProps<Options>>;

/**
 * Renders a semantic native button with cooperative host customization.
 *
 * @remarks
 * ## Why
 *
 * `Button` retains browser keyboard, form, focus, and accessibility behavior.
 * Its internal props only establish the default type and disabled state. Any
 * `onclick` behavior belongs entirely to the consumer and receives a real DOM
 * event; there is no component-internal click action to chain or cancel.
 *
 * ## Ownership and lifetime
 *
 * Calling the factory is inert. Running its Fx owns the host's dynamic parts
 * and listeners in an Effect Scope. A custom host must apply the supplied props
 * and content so disabled and button-type semantics are not lost.
 *
 * @example
 * ```ts
 * import { Button } from "@typed/ui/Button"
 *
 * const submit = Button({ type: "submit", content: "Save" })
 * ```
 *
 * @since 1.0.0
 * @category components
 */
export function Button<const Options extends ButtonOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, ButtonInternalProps<Options>>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLButtonElement>()(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<button ...${props}>${content}</button>`,
  );
}
