import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Equal from "effect/Equal";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { identity } from "effect/Function";
import * as Scope from "effect/Scope";
import { RefSubject, Sink } from "@typed/fx";
import { HydrateContext } from "../HydrateContext.js";
import type { Many } from "../many.js";
import type { TemplateContext } from "../Render.js";
import { DomRenderEvent, type RenderEvent } from "../RenderEvent.js";
import { getAllSiblingsBetween, isWire, type Rendered, type Wire } from "../Wire.js";
import { makeNodeUpdater, renderEventToArray } from "./dom.js";
import type { HydrationMany } from "./hydration.js";
import { getChildNodes } from "./hydration.js";
import { encodeManyKey, getUniqueManyKeys, validateHydratableManyKeys } from "./manyKey.js";

type ManyEntry<A> = {
  readonly ref: RefSubject.RefSubject<A>;
  readonly scope: Scope.Closeable;
  nodes: Array<Node>;
  value: A;
};

type HydratedEntry = {
  readonly marker: Comment;
  readonly nodes: ReadonlyArray<Node>;
};

export function renderManyToDom<A, E, R>(
  many: Many<A, E, R>,
  endComment: Comment,
  index: number,
  ctx: TemplateContext,
  hydrateContext?: HydrateContext,
): Effect.Effect<unknown, never, R | Scope.Scope> {
  ctx.expected++;
  const entries = new Map<PropertyKey, ManyEntry<A>>();
  const localSymbolOrdinals = new Map<symbol, number>();
  const hydratedEntries = getHydratedEntries(hydrateContext);
  const initialNodes =
    hydrateContext?.where._tag === "hole"
      ? getAllSiblingsBetween(hydrateContext.where.startComment, hydrateContext.where.endComment)
      : [];
  const updateNodes = makeNodeUpdater(ctx.document, endComment, null, initialNodes);
  let order: ReadonlyArray<PropertyKey> = [];
  let initialized = false;

  const renderEntries = () =>
    updateNodes(DomRenderEvent(order.flatMap((key) => entries.get(key)?.nodes ?? [])));
  const release = () => {
    if (initialized) return;
    initialized = true;
    ctx.refCounter.release(index);
  };

  const reconcile = (values: ReadonlyArray<A>) =>
    Effect.gen(function* () {
      const keys = getUniqueManyKeys(values, many.getKey);
      if (Cause.isIllegalArgumentError(keys)) return yield* ctx.onCause(Cause.fail(keys));
      const invalidKeys = hydrateContext && validateHydratableManyKeys(keys.keys);
      if (invalidKeys) return yield* ctx.onCause(Cause.fail(invalidKeys));

      const previousOrder = order;
      order = keys.keys;

      for (const key of previousOrder) {
        if (!keys.indices.has(key)) {
          yield* Scope.close(entries.get(key)!.scope, Exit.void);
          entries.delete(key);
        }
      }

      for (let itemIndex = 0; itemIndex < values.length; itemIndex++) {
        const value = values[itemIndex];
        const key = order[itemIndex];
        const entry = entries.get(key);
        if (entry === undefined) {
          const encodedKey = encodeManyKey(key, localSymbolOrdinals);
          const pending = yield* makeEntry(
            many,
            value,
            key,
            encodedKey,
            ctx,
            hydrateContext,
            hydratedEntries.get(encodedKey),
            renderEntries,
          );
          entries.set(key, pending.entry);
          yield* pending.start;
        } else if (!Equal.equals(entry.value, value)) {
          entry.value = value;
          yield* RefSubject.set(entry.ref, value);
        }
      }

      renderEntries();
      release();
    });

  return many.values
    .run(Sink.make(ctx.onCause, reconcile))
    .pipe(Effect.onExit(() => Effect.sync(release)));
}

function makeEntry<A, E, R>(
  many: Many<A, E, R>,
  value: A,
  key: PropertyKey,
  encodedKey: string,
  ctx: TemplateContext,
  hydrateContext: HydrateContext | undefined,
  hydratedEntry: HydratedEntry | undefined,
  onUpdate: () => void,
): Effect.Effect<
  { readonly entry: ManyEntry<A>; readonly start: Effect.Effect<void, never, R> },
  never,
  Scope.Scope
> {
  return Effect.gen(function* () {
    const scope = yield* Scope.fork(ctx.scope, "sequential");
    const ref = yield* RefSubject.make(value).pipe(Effect.provideService(Scope.Scope, scope));
    const entry: ManyEntry<A> = {
      ref,
      scope,
      nodes: hydratedEntry === undefined ? [] : Array.from(hydratedEntry.nodes),
      value,
    };
    const ready = hydratedEntry === undefined ? undefined : yield* Deferred.make<void>();
    let isHydrating = hydratedEntry !== undefined;
    const update = (event: RenderEvent) =>
      Effect.sync(() => {
        if (isHydrating) {
          isHydrating = false;
          return;
        }
        entry.nodes = toConcreteNodes(ctx.document, event, hydratedEntry?.marker);
        onUpdate();
      }).pipe(
        ready === undefined ? identity : Effect.tap(() => Deferred.succeed(ready, undefined)),
      );
    const child = many
      .render(ref, key)
      .run(Sink.make(ctx.onCause, update))
      .pipe(Effect.provideService(Scope.Scope, scope)) as Effect.Effect<unknown, never, R>;
    const hydratedChild =
      hydrateContext === undefined
        ? child
        : (Effect.provideService(child, HydrateContext, {
            ...hydrateContext,
            hydrate: true,
            manyKey: encodedKey,
          }) as Effect.Effect<unknown, never, R>);
    const runnable =
      ready === undefined
        ? hydratedChild
        : Effect.ensuring(hydratedChild, Deferred.succeed(ready, undefined));
    const start = Effect.gen(function* () {
      yield* Effect.forkIn(runnable, scope, { startImmediately: true });
      if (ready !== undefined) yield* Deferred.await(ready);
    });

    return { entry, start };
  });
}

function getHydratedEntries(
  hydrateContext: HydrateContext | undefined,
): ReadonlyMap<string, HydratedEntry> {
  const entries = new Map<string, HydratedEntry>();
  if (hydrateContext?.where._tag !== "hole") return entries;
  const manyNodes = getChildNodes(hydrateContext.where).filter(
    (node): node is HydrationMany => node._tag === "many",
  );
  let previous: Node = hydrateContext.where.startComment;
  for (const many of manyNodes) {
    entries.set(many.key, {
      marker: many.comment,
      nodes: [...getAllSiblingsBetween(previous, many.comment), many.comment],
    });
    previous = many.comment;
  }
  return entries;
}

function toConcreteNodes(
  document: Document,
  event: RenderEvent,
  marker: Comment | undefined,
): Array<Node> {
  const nodes = renderEventToArray(document, event).flatMap(getConcreteNodes);
  if (marker !== undefined) nodes.push(marker);
  return nodes;
}

function getConcreteNodes(node: Node): ReadonlyArray<Node> {
  if (!isWire(node as Rendered)) {
    return node.nodeType === node.DOCUMENT_FRAGMENT_NODE ? Array.from(node.childNodes) : [node];
  }
  const wire = node as unknown as Wire;
  return [
    wire.firstChild!,
    ...getAllSiblingsBetween(wire.firstChild!, wire.lastChild!),
    wire.lastChild!,
  ];
}
