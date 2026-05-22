import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";

export interface Item<Value = unknown> {
  readonly id: string;
  readonly element?: Element;
  readonly disabled?: boolean;
  readonly value?: Value;
}

export type State<Value = unknown> = readonly Item<Value>[];

export function makeState<Value = unknown>(
  initial: State<Value> = [],
): Effect.Effect<RefSubject.RefSubject<State<Value>>, never, Scope.Scope> {
  return RefSubject.make(initial);
}

export function register<Value>(
  collection: RefSubject.RefSubject<State<Value>>,
  item: Item<Value>,
): Effect.Effect<void, never, Scope.Scope> {
  return Effect.gen(function* () {
    yield* RefSubject.update(collection, (items) => upsert(items, item)).pipe(Effect.asVoid);
    const scope = yield* Effect.scope;
    yield* Scope.addFinalizer(scope, unregister(collection, item.id));
  });
}

export function unregister<Value>(
  collection: RefSubject.RefSubject<State<Value>>,
  id: string,
): Effect.Effect<void> {
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
