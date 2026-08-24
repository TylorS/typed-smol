import type * as Scope from "effect/Scope";
import type * as Fx from "@typed/fx/Fx";
import { Navigation, type NavigationError } from "@typed/navigation";
import { EventHandler, type RenderTemplate } from "@typed/template";
import { Link } from "../Link.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

type ClickError = { readonly _tag: "ClickError" };
type ClickService = { readonly ClickService: unique symbol };

declare const onclick: EventHandler.EventHandler<Event, ClickError, ClickService>;

const link = Link({ href: "/", content: "Home", onclick });

type _LinkErrors = Assert<Equal<Fx.Error<typeof link>, ClickError | NavigationError>>;
type _LinkServices = Assert<
  Equal<Fx.Services<typeof link>, ClickService | Navigation | Scope.Scope | RenderTemplate>
>;
