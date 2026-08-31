import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type { Scope } from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";
import type { Many } from "../many.js";
import { HtmlRenderEvent, isHtmlRenderEvent, type RenderEvent } from "../RenderEvent.js";
import { renderToString } from "./encoding.js";
import {
  encodeManyKey,
  getUniqueManyKeys,
  manyMarkerFromEncodedKey,
  validateHydratableManyKeys,
} from "./manyKey.js";

export function renderManyToHtml<A, E, R, B extends PropertyKey, E2, R2>(
  many: Many<A, E, R, B, E2, R2>,
): Fx.Fx<RenderEvent, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope> {
  return Fx.gen(function* () {
    const initial = yield* Fx.first(many.values);
    if (Option.isNone(initial) || initial.value.length === 0) return Fx.empty;
    const uniqueKeys = getUniqueManyKeys(initial.value, many.getKey);
    if (Cause.isIllegalArgumentError(uniqueKeys)) return Fx.fail(uniqueKeys);
    const invalidKeys = validateHydratableManyKeys(uniqueKeys.keys);
    if (invalidKeys !== undefined) return Fx.fail(invalidKeys);
    const entries = yield* Effect.sync(() =>
      prepareManyEntries(initial.value, uniqueKeys.keys, new Map()),
    );
    const lastIndex = entries.length - 1;
    return Fx.mergeOrdered(
      ...entries.map(({ encodedKey, key, value }, index) =>
        renderValue(value, key, encodedKey, many.render, index === lastIndex),
      ),
    );
  });
}

function renderValue<A, B extends PropertyKey, R2, E2>(
  value: A,
  key: B,
  encodedKey: string,
  render: (value: RefSubject.RefSubject<A>, key: B) => Fx.Fx<RenderEvent, E2, R2 | Scope>,
  last: boolean,
): Fx.Fx<RenderEvent, E2, R2 | Scope> {
  return Fx.unwrap(
    Effect.map(RefSubject.make(value), (ref) =>
      render(RefSubject.slice(ref, 0, 1), key).pipe(
        Fx.dropAfter((event) => isHtmlRenderEvent(event) && event.last),
        Fx.map((event) => HtmlRenderEvent(renderToString(event, ""), false)),
        Fx.append(HtmlRenderEvent(manyMarkerFromEncodedKey(encodedKey), last)),
      ),
    ),
  );
}

function prepareManyEntries<A, B extends PropertyKey>(
  values: ReadonlyArray<A>,
  keys: ReadonlyArray<B>,
  localSymbolOrdinals: Map<symbol, number>,
) {
  return values.map((value, index) => {
    const key = keys[index];
    return { encodedKey: encodeManyKey(key, localSymbolOrdinals), key, value } as const;
  });
}
