/**
 * Group supplies a neutral ARIA group host and an optional label host. Callers retain the normal
 * Dom host-override contract and must provide either an accessible label or a labelled-by
 * relationship where the surrounding widget requires one.
 *
 * @remarks
 * The module keeps policy, state transitions, and DOM rendering separable so applications can use
 * the state and pure operations without mounting UI, or supply custom hosts without replacing native
 * events and browser-owned focus.
 *
 * @since 1.0.0
 * @category modules
 * @packageDocumentation
 */
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import { html, type Renderable, type RenderEvent, type RenderTemplate } from "@typed/template";
import * as Dom from "./Dom.js";
import type { HostResult } from "./Dom/Types.js";

/**
 * Inputs accepted by Group.Group in addition to the shared DOM host options.
 *
 * @remarks
 * ## Why
 *
 * The options type makes required state, content, accessible relationships, and custom-host inputs
 * visible before rendering.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { GroupOptions } from "@typed/ui/Group";` Extend the [Group.Group
 * runnable setup](/reference/%40typed%2Fui%2FGroup%23Group). A labeled group host accepts
 * `const options: GroupOptions = { label: "Formatting", content: "Controls" }`.
 * @since 1.0.0
 * @category models
 */
export interface GroupOptions extends Dom.HostOptions<HTMLDivElement> {
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
  /**
   * Accessible label rendered through aria-label.
   * @since 1.0.0
   * @category models
   */
  readonly label?: Renderable.Any<string | null | undefined>;
  /**
   * Id of the external element used through aria-labelledby.
   * @since 1.0.0
   * @category models
   */
  readonly labelledBy?: Renderable.Any<string | null | undefined>;
}

function internalProps<const Options extends GroupOptions>({ property }: Dom.InternalPropsHelpers<Options>) {
  return {
    role: "group",
    "aria-label": property("label", undefined),
    "aria-labelledby": property("labelledBy", undefined),
  };
}

type GroupInternalProps<Options extends GroupOptions> = ReturnType<typeof internalProps<Options>>;

/**
 * Renders a div host with role=group and caller-controlled aria-label or aria-labelledby.
 *
 * @remarks
 * ## Why
 *
 * The component applies the family behavior while leaving callers free to supply a custom host
 * through the shared DOM boundary.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @example
 * ```ts
 * import * as Group from "@typed/ui/Group";
 *
 * const view = Group.Group({ label: "Formatting", content: "Controls" });
 * ```
 * @since 1.0.0
 * @category components
 */
export function Group<const Options extends GroupOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, GroupInternalProps<Options>>, Options["content"], Host>,
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
 * Inputs accepted by Group.Label in addition to the shared DOM host options.
 *
 * @remarks
 * ## Why
 *
 * The options type makes required state, content, accessible relationships, and custom-host inputs
 * visible before rendering.
 *
 * ## Ownership and lifetime
 *
 * This declaration is data or schema metadata and acquires no resources.
 *
 * ## Example
 *
 * Import with `import type { LabelOptions } from "@typed/ui/Group";` Extend the [Group.Group
 * runnable setup](/reference/%40typed%2Fui%2FGroup%23Group). A visible group label accepts
 * `const options: LabelOptions = { content: "Formatting" }`.
 * @since 1.0.0
 * @category models
 */
export interface LabelOptions extends Dom.HostOptions<HTMLSpanElement> {
  /**
   * Renderable child content for the component host.
   * @since 1.0.0
   * @category models
   */
  readonly content: Renderable.Any;
}

/**
 * Renders the group's visible label content without inventing an implicit id relationship.
 *
 * @remarks
 * ## Why
 *
 * The component applies the family behavior while leaving callers free to supply a custom host
 * through the shared DOM boundary.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx installs DOM refs, native listeners, state subscriptions, and optional
 * collection registrations only when rendered. The rendering Scope removes those resources;
 * unrelated nodes and attributes remain caller-owned.
 *
 * @example
 * ```ts
 * import * as Group from "@typed/ui/Group";
 *
 * const view = Group.Label({ content: "Formatting" });
 * ```
 * @since 1.0.0
 * @category components
 */
export function Label<const Options extends LabelOptions, const Host extends HostResult = never>(
  options: Options,
  host?: Dom.HostOverride<Dom.RenderHostProps<Options, Record<never, never>>, Options["content"], Host>,
): Fx<
  RenderEvent,
  Renderable.Error<Options | Host>,
  Renderable.Services<Options | Host> | Scope.Scope | RenderTemplate
> {
  return Dom.renderHost<HTMLSpanElement>()(
    options,
    host,
    () => ({}),
    options.content,
    (props, content) => html`<span ...${props}>${content}</span>`,
  );
}
