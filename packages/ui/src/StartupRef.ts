import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import * as DataAttr from "./DataAttr.js";

export type RefCallback<E = never, R = never> = (
  element: HTMLElement,
) => void | Effect.Effect<void, E, R>;

type RefError<Ref> = Ref extends RefCallback<infer E, any> ? E : never;
type RefServices<Ref> = Ref extends RefCallback<any, infer R> ? R : never;

export function fromData<State extends Record<string, unknown>, Fields extends DataAttr.DataFields>(
  ref: RefSubject.RefSubject<State>,
  data: DataAttr.DataAttr<Fields> &
    (DataAttr.Type<Fields> extends Partial<State> ? unknown : never),
): RefCallback<Schema.SchemaError, Schema.Struct.DecodingServices<Fields>> {
  return (element) =>
    DataAttr.decode(data, element).pipe(
      Effect.flatMap((value) =>
        RefSubject.update(ref, (current) => ({ ...current, ...value })),
      ),
      Effect.asVoid,
    );
}

export function compose<const Refs extends ReadonlyArray<RefCallback<any, any>>>(
  ...refs: Refs
): RefCallback<RefError<Refs[number]>, RefServices<Refs[number]>> {
  return (element) =>
    Effect.gen(function* () {
      for (const ref of refs) {
        const result = ref(element);
        if (Effect.isEffect(result)) yield* result;
      }
    });
}
