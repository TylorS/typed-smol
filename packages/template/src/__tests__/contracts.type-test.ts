import type * as Effect from "effect/Effect";
import type * as Cause from "effect/Cause";
import type * as Scope from "effect/Scope";
import type * as FxType from "@typed/fx/Fx";
import type * as RefSubject from "@typed/fx/RefSubject";
import { EventHandler, html, many, render, type RenderTemplate } from "@typed/template";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
type Extends<A, B> = [A] extends [B] ? true : false;

type EffectService = { readonly EffectService: unique symbol };
type FxService = { readonly FxService: unique symbol };
type HandlerService = { readonly HandlerService: unique symbol };
type ListService = { readonly ListService: unique symbol };
type HydrationService = { readonly HydrationService: unique symbol };

declare const effectValue: Effect.Effect<string, "effect-error", EffectService>;
declare const fxValue: FxType.Fx<number, "fx-error", FxService>;
declare const click: EventHandler.EventHandler<MouseEvent, "handler-error", HandlerService>;

const mixed = html`<button onclick=${click}>${effectValue} ${fxValue}</button>`;

type _MixedErrors = Assert<
  Equal<FxType.Error<typeof mixed>, "effect-error" | "fx-error" | "handler-error">
>;
type MixedServices = EffectService | FxService | HandlerService | Scope.Scope | RenderTemplate;
type _MixedServicesAreRequired = Assert<Extends<MixedServices, FxType.Services<typeof mixed>>>;
type _MixedServicesAreExact = Assert<Extends<FxType.Services<typeof mixed>, MixedServices>>;

declare const items: FxType.Fx<ReadonlyArray<{ readonly id: string }>, "list-error", ListService>;

const list = many(
  items,
  (item) => item.id,
  (item) => html`<li>${item}</li>`,
);

type ListErrors = "list-error" | Cause.IllegalArgumentError;
type _ListErrorsAreRequired = Assert<Extends<ListErrors, FxType.Error<typeof list>>>;
type _ListErrorsAreExact = Assert<Extends<FxType.Error<typeof list>, ListErrors>>;
type ListServices = ListService | Scope.Scope | RenderTemplate;
type _ListServicesAreRequired = Assert<Extends<ListServices, FxType.Services<typeof list>>>;
type _ListServicesAreExact = Assert<Extends<FxType.Services<typeof list>, ListServices>>;

many(
  items,
  // @ts-expect-error many keys are constrained to PropertyKey
  (item) => ({ id: item.id }),
  (item) => html`<li>${item}</li>`,
);

declare const host: HTMLElement;
const directRender = render(mixed, host);
const curriedRender = render(host)(mixed);

type _DirectRenderErrors = Assert<
  Equal<FxType.Error<typeof directRender>, FxType.Error<typeof mixed>>
>;
type _CurriedRenderServices = Assert<
  Equal<FxType.Services<typeof curriedRender>, FxType.Services<typeof mixed>>
>;

declare const hydrated: RefSubject.HydratedRefSubject<
  number,
  "hydration-error",
  never,
  HydrationService
>;

const hydratedTemplate = html`<button ref=${hydrated}>${hydrated}</button>`;

type _HydratedErrors = Assert<Equal<FxType.Error<typeof hydratedTemplate>, "hydration-error">>;
type HydratedServices = HydrationService | Scope.Scope | RenderTemplate;
type _HydratedServicesAreRequired = Assert<
  Extends<HydratedServices, FxType.Services<typeof hydratedTemplate>>
>;
type _HydratedServicesAreExact = Assert<
  Extends<FxType.Services<typeof hydratedTemplate>, HydratedServices>
>;
