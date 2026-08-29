import * as Effect from "effect/Effect";
import * as Equal from "effect/Equal";
import * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import * as Equivalence from "effect/Equivalence";

export interface Item<Value = unknown, Element extends object = globalThis.Element> {
  readonly id: string;
  readonly element?: Element;
  readonly disabled?: boolean;
  readonly submenu?: boolean;
  readonly textValue?: string;
  readonly value?: Value;
}

export type State<Value = unknown, Element extends object = globalThis.Element> = readonly Item<
  Value,
  Element
>[];

export function makeState<Value = unknown, Element extends object = globalThis.Element>(
  initial: State<Value, Element> = [],
): Effect.Effect<RefSubject.RefSubject<State<Value, Element>>, never, Scope.Scope> {
  // DOM elements are runtime handles; structural equality would traverse browser internals.
  return RefSubject.make(initial, { eq: Equivalence.Array(itemEquivalence<Value, Element>()) });
}

export function register<Value, Element extends object, E, R>(
  collection: RefSubject.RefSubject<State<Value, Element>, E, R>,
  item: Item<Value, Element>,
): Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.gen(function* () {
    yield* RefSubject.update(collection, (items) => upsert(items, item)).pipe(Effect.asVoid);

    const services = yield* Effect.context<R>();
    const scope = yield* Effect.scope;
    yield* Scope.addFinalizer(
      scope,
      unregisterRegistered(collection, item).pipe(
        Effect.provide(services),
        Effect.ignore({ log: true }),
      ),
    );
  });
}

/** Registers a mounted element and removes it automatically with that element's Scope. */
export function ref<Value, Element extends object, E, R>(
  collection: RefSubject.RefSubject<State<Value, Element>, E, R>,
  item: Omit<Item<Value, Element>, "element">,
): (element: Element) => Effect.Effect<void, E, R | Scope.Scope> {
  return Effect.fn((element) => register(collection, { ...item, element }));
}

export function unregister<Value, Element extends object, E, R>(
  collection: RefSubject.RefSubject<State<Value, Element>, E, R>,
  id: string,
): Effect.Effect<void, E, R> {
  return RefSubject.update(collection, (items) => items.filter((item) => item.id !== id)).pipe(
    Effect.asVoid,
  );
}

export function enabledItems<ItemType extends Item<unknown, object>>(
  items: readonly ItemType[],
): readonly ItemType[] {
  return items.filter((item) => item.disabled !== true);
}

export function byDomOrder<ItemType extends Item<unknown, object>>(
  items: readonly ItemType[],
): readonly ItemType[] {
  return items.toSorted((left, right) => {
    if (left.element === undefined || right.element === undefined) return 0;

    const compareDocumentPosition = Reflect.get(left.element, "compareDocumentPosition");
    if (typeof compareDocumentPosition !== "function") return 0;
    const position = compareDocumentPosition.call(left.element, right.element) as number;
    if (position & 2) return 1;
    if (position & 4) return -1;
    return 0;
  });
}

function unregisterRegistered<Value, Element extends object, E, R>(
  collection: RefSubject.RefSubject<State<Value, Element>, E, R>,
  item: Item<Value, Element>,
): Effect.Effect<void, E, R> {
  return RefSubject.update(collection, (items) =>
    items.filter((current) => current.id !== item.id || current !== item),
  ).pipe(Effect.asVoid);
}

function upsert<Value, Element extends object>(
  items: State<Value, Element>,
  item: Item<Value, Element>,
): State<Value, Element> {
  const index = items.findIndex((current) => current.id === item.id);
  return index === -1 ? [...items, item] : items.toSpliced(index, 1, item);
}

function itemEquivalence<Value, Element extends object>(): Equivalence.Equivalence<
  Item<Value, Element>
> {
  return Equivalence.make(
    (left, right) =>
      left.id === right.id &&
      left.element === right.element &&
      left.disabled === right.disabled &&
      left.submenu === right.submenu &&
      left.textValue === right.textValue &&
      Equal.equals(left.value, right.value),
  );
}
