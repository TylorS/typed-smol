import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

const style =
  "border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px";

/**
 * Options for content hidden visually but retained for assistive technology.
 * @remarks
 * ## Why
 * Some controls need an accessible name or instruction that should not alter
 * the visual layout.
 * ## Ownership and lifetime
 * The options are inert; dynamic content follows the rendered Scope.
 * @since 1.0.0
 * @category models
 */
export interface VisuallyHiddenOptions extends Dom.HostOptions<HTMLSpanElement> {
  /** Content retained in the document and accessibility tree.
   * @remarks
   * ## Why
   * Unlike `hidden` or `display: none`, clipped content remains perceivable to
   * screen readers.
   * ## Ownership and lifetime
   * Dynamic content is released when the component Scope closes.
   * @since 1.0.0
   * @category content
   */
  readonly content: Renderable.Any;
}

function internalProps() {
  return { style };
}

type VisuallyHiddenInternalProps = ReturnType<typeof internalProps>;

/**
 * Renders screen-reader-accessible content with standard clipping styles.
 * @remarks
 * ## Why
 * The primitive supplies a tested visual-hiding recipe without removing the
 * node from semantic layout or the accessibility tree.
 * ## Ownership and lifetime
 * Running the Fx owns the rendered span and dynamic content in its Effect
 * Scope. A custom host must preserve the supplied clipping styles.
 * @example
 * ```ts
 * import { VisuallyHidden } from "@typed/ui/VisuallyHidden"
 *
 * const label = VisuallyHidden({ content: "Open navigation" })
 * ```
 * @since 1.0.0
 * @category components
 */
export function VisuallyHidden<
  const Options extends VisuallyHiddenOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, VisuallyHiddenInternalProps>,
    Options["content"],
    Host
  >,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLSpanElement>()(
    options,
    host,
    internalProps,
    options.content,
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}
