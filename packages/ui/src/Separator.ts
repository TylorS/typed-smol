import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * Options for a non-interactive ARIA separator.
 * @remarks
 * ## Why
 * Orientation communicates whether the visual division is horizontal or
 * vertical without implying splitter interaction.
 * ## Ownership and lifetime
 * The model is inert; dynamic orientation follows the rendered Scope.
 * @since 1.0.0
 * @category models
 */
export interface SeparatorOptions extends Dom.HostOptions<HTMLDivElement> {
  /** Separator orientation, defaulting to horizontal.
   * @remarks
   * ## Why
   * Assistive technology uses orientation to interpret the division.
   * ## Ownership and lifetime
   * The dynamic attribute subscription ends with the component Scope.
   * @since 1.0.0
   * @category accessibility
   */
  readonly orientation?: Renderable.Any<"horizontal" | "vertical" | null | undefined>;
}

function internalProps<const Options extends SeparatorOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return { role: "separator", "aria-orientation": property("orientation", "horizontal") };
}

type SeparatorInternalProps<Options extends SeparatorOptions> = ReturnType<
  typeof internalProps<Options>
>;

/**
 * Renders a non-focusable element with `role="separator"`.
 * @remarks
 * ## Why
 * This component expresses a semantic division. Use `WindowSplitter` when the
 * separator changes pane sizes and therefore requires keyboard interaction.
 * ## Ownership and lifetime
 * Running the Fx owns its reactive attribute until the Effect Scope closes. A
 * custom host must preserve the role and orientation.
 * @example
 * ```ts
 * import { Separator } from "@typed/ui/Separator"
 *
 * const divider = Separator({ orientation: "vertical" })
 * ```
 * @since 1.0.0
 * @category components
 */
export function Separator<
  const Options extends SeparatorOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, SeparatorInternalProps<Options>>, "", Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLDivElement>()(
    options,
    host,
    internalProps,
    "",
    (props) => html`<div ...${props}></div>`,
  );
}
