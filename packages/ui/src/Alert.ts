import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * Options for the assertive alert live region.
 *
 * @remarks
 * ## Why
 *
 * Alerts announce important, time-sensitive output without moving focus or
 * requiring a modal interaction.
 *
 * ## Ownership and lifetime
 *
 * The options are inert. Rendering owns only the alert host and subscriptions
 * for renderable option values; the running Effect Scope removes them.
 *
 * @since 1.0.0
 * @category models
 */
export interface AlertOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Content announced by the `role="alert"` live region.
   *
   * @remarks
   * ## Why
   *
   * Keeping the announcement renderable lets applications publish Effect- or
   * Fx-backed status while retaining the platform accessibility tree.
   *
   * ## Ownership and lifetime
   *
   * The value acquires no resources itself. Rendering subscribes to dynamic
   * content for the lifetime of the alert's Scope.
   *
   * @since 1.0.0
   * @category content
   */
  readonly content: Renderable.Any;
}

function internalProps() {
  return { role: "alert" } as const;
}
type AlertInternalProps = ReturnType<typeof internalProps>;

/**
 * Renders a non-modal, assertive live region.
 *
 * For an interrupting confirmation, use `Dialog.Content` with
 * `role="alertdialog"`; an alert must not take focus or require dismissal.
 *
 * @remarks
 * ## Why
 *
 * `Alert` supplies the native ARIA live-region contract while leaving content,
 * host choice, and Effect requirements composable. It does not synthesize an
 * event or introduce an application-owned announcement queue.
 *
 * ## Ownership and lifetime
 *
 * Calling `Alert` starts no work. Running the returned Fx owns the rendered
 * host, dynamic values, and listeners in its Effect Scope; finalization removes
 * only those resources. A custom host must preserve the supplied `role`.
 *
 * @example
 * ```ts
 * import { Alert } from "@typed/ui/Alert"
 *
 * const saved = Alert({ content: "Changes saved" })
 * ```
 *
 * @since 1.0.0
 * @category components
 */
export function Alert<const Options extends AlertOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, AlertInternalProps>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<div ...${props}>${content}</div>`,
  );
}
