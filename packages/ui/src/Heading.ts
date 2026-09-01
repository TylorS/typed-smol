import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * Options for an ARIA heading whose level may be reactive.
 * @remarks
 * ## Why
 * Separating heading semantics from a fixed tag supports reusable components
 * whose outline level is selected by their context.
 * ## Ownership and lifetime
 * The options are inert; rendering owns dynamic values for its Scope.
 * @since 1.0.0
 * @category models
 */
export interface HeadingOptions extends Dom.HostOptions<HTMLDivElement> {
  /** Heading content and accessible name.
   * @remarks
   * ## Why
   * Visible content participates directly in the accessibility tree.
   * ## Ownership and lifetime
   * Dynamic content follows the rendered Scope.
   * @since 1.0.0
   * @category content
   */
  readonly content: Renderable.Any;
  /** ARIA heading level, defaulting to one.
   * @remarks
   * ## Why
   * The level communicates document hierarchy even when the host tag is fixed.
   * ## Ownership and lifetime
   * The reflected value retains no resources.
   * @since 1.0.0
   * @category accessibility
   */
  readonly level?: Renderable.Any<number | null | undefined>;
}

function internalProps<const Options extends HeadingOptions>({
  property,
}: Dom.InternalPropsHelpers<Options>) {
  return { role: "heading", "aria-level": property("level", 1) };
}

type HeadingInternalProps<Options extends HeadingOptions> = ReturnType<
  typeof internalProps<Options>
>;

/**
 * Renders a host with `role="heading"` and a reactive `aria-level`.
 * @remarks
 * ## Why
 * The primitive lets a design system preserve document-outline semantics when
 * its visual host cannot be selected statically.
 * ## Ownership and lifetime
 * Running the returned Fx owns its dynamic attributes and content in an Effect
 * Scope. A custom host must preserve `role` and `aria-level`.
 * @example
 * ```ts
 * import { Heading } from "@typed/ui/Heading"
 *
 * const title = Heading({ level: 3, content: "Details" })
 * ```
 * @since 1.0.0
 * @category components
 */
export function Heading<
  const Options extends HeadingOptions,
  const Host extends HostResult = never,
>(
  options: Options,
  host?: Dom.HostOverride<
    Dom.RenderHostProps<Options, HeadingInternalProps<Options>>,
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

/**
 * Alias for `Heading` retained for level-oriented imports.
 * @remarks
 * ## Why
 * The alias names the role the component plays in a contextual heading system.
 * ## Ownership and lifetime
 * It has exactly the same Scope and host ownership as `Heading`.
 * @since 1.0.0
 * @category aliases
 */
export const Level = Heading;
/**
 * Descriptive alias for `Heading`.
 * @remarks
 * ## Why
 * The name remains available without duplicating an implementation contract.
 * ## Ownership and lifetime
 * It has exactly the same Scope and host ownership as `Heading`.
 * @since 1.0.0
 * @category aliases
 */
export const HeadingLevel = Heading;
