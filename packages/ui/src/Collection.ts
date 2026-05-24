import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import * as DataAttr from "./DataAttr.js";

export interface Item<Value = unknown> {
  readonly id: string;
  readonly element?: globalThis.Element;
  readonly disabled?: boolean;
  readonly value?: Value;
  readonly textValue?: string;
}

export type State<Value = unknown> = readonly Item<Value>[];

export const data = DataAttr.schema({
  size: Schema.NumberFromString,
});

export const component = "typed/ui/Collection";

export function makeState<Value = unknown>(
  initial: State<Value> = [],
): Effect.Effect<RefSubject.RefSubject<State<Value>>, never, Scope.Scope> {
  return RefSubject.make(initial);
}

export function register<Value, E, R>(
  collection: RefSubject.RefSubject<State<Value>, E, R>,
  item: Item<Value>,
): Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.gen(function* () {
    yield* RefSubject.update(collection, (items) => upsert(items, item)).pipe(Effect.asVoid);
    const context = yield* Effect.context<R>();
    const scope = yield* Effect.scope;
    yield* Scope.addFinalizer(
      scope,
      unregister(collection, item.id).pipe(Effect.provide(context), Effect.ignore({ log: true })),
    );
  });
}

export function unregister<Value, E, R>(
  collection: RefSubject.RefSubject<State<Value>, E, R>,
  id: string,
): Effect.Effect<void, E, R> {
  return RefSubject.update(collection, (items) => items.filter((item) => item.id !== id)).pipe(
    Effect.asVoid,
  );
}

export function enabledItems<ItemType extends Item>(
  items: readonly ItemType[],
): readonly ItemType[] {
  return items.filter((item) => item.disabled !== true);
}

export function byDomOrder<ItemType extends Item>(items: readonly ItemType[]): readonly ItemType[] {
  return items.toSorted(compareByDomOrder);
}

function upsert<Value>(items: State<Value>, item: Item<Value>): State<Value> {
  const next = items.filter((current) => current.id !== item.id);
  return next.concat(item);
}

function compareByDomOrder(a: Item, b: Item): number {
  if (!a.element || !b.element || a.element === b.element) return 0;
  const position = a.element.compareDocumentPosition(b.element);
  if (position & 2) return 1;
  if (position & 4) return -1;
  return 0;
}
