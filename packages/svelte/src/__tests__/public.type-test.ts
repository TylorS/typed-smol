/** @effect-diagnostics missingEffectError:skip-file */

import type * as Effect from "effect/Effect";
import type * as ManagedRuntime from "effect/ManagedRuntime";
import type * as Scope from "effect/Scope";
import type { Fx } from "@typed/fx/Fx";
import type { RefSubject } from "@typed/fx/RefSubject/RefSubject";
import type { RenderEvent } from "@typed/template/RenderEvent";
import type { RenderTemplate } from "@typed/template/RenderTemplate";
import type { Component } from "svelte";
import { SvelteRender, attachment, toReadable, toWritable, view } from "../lib/index.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type Props = { readonly label: string };
type PropsError = { readonly _tag: "PropsError" };
type PropsService = { readonly PropsService: unique symbol };

declare const component: Component<Props>;
declare const props: Effect.Effect<Props, PropsError, PropsService>;

const rendered = view(component, props);
type _ViewError = Assert<Equal<Fx.Error<typeof rendered>, PropsError>>;
type _ViewServices = Assert<
  Equal<Fx.Services<typeof rendered>, PropsService | Scope.Scope | RenderTemplate | SvelteRender>
>;

view(component, { label: "ok" });
// @ts-expect-error component props are inferred from the Svelte component
view(component, { label: 123 });

declare const failingFx: Fx<number, PropsError>;
declare const failingRef: RefSubject<number, PropsError>;
// @ts-expect-error Svelte Readable has no Typed error channel
void toReadable(failingFx, 0);
// @ts-expect-error Svelte Writable has no Typed error channel
void toWritable(failingRef);

declare const typedView: Fx<RenderEvent, never, RenderTemplate | Scope.Scope>;
declare const runtime: ManagedRuntime.ManagedRuntime<RenderTemplate, never>;
attachment(runtime, typedView);

declare const runtimeWithoutRenderer: ManagedRuntime.ManagedRuntime<never, never>;
// @ts-expect-error the ManagedRuntime must provide the Typed view's services
attachment(runtimeWithoutRenderer, typedView);
