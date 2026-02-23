import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { continueWith } from "./continueWith.js";
import { filter } from "./filter.js";
import { map } from "./map.js";
import { mergeAll } from "./mergeAll.js";
import { zip } from "./zip.js";

/**
 * Merges two Fx streams into a single Fx that emits values from both streams
 * concurrently. Order of emission is non-deterministic.
 *
 * **Completion:** The merged stream completes when **both** input streams have
 * completed.
 *
 * **Errors:** The first failure from either stream fails the merged stream;
 * the other stream is interrupted.
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits values from both streams.
 * @since 1.0.0
 * @category combinators
 */
export const merge: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A | A2, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A | A2, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A | A2, E | E2, R | R2> =>
    mergeAll(self, that),
);

/**
 * Concatenates two Fx streams: runs the first to completion, then runs the
 * second. Emits all values from the first stream in order, then all values
 * from the second stream in order.
 *
 * **Completion:** The concatenated stream completes when the **second** stream
 * completes (the first must complete before the second starts).
 *
 * **Errors:** If the first stream fails, the concatenated stream fails and the
 * second is never run. If the second stream fails, the concatenated stream
 * fails after the first has already completed.
 *
 * @param that - The second Fx stream (run after the first completes).
 * @returns An Fx that emits values from the first stream, then the second.
 * @since 1.0.0
 * @category combinators
 */
export const concat: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A | A2, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A | A2, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A | A2, E | E2, R | R2> =>
    continueWith(self, () => that),
);

/**
 * Zips two Fx streams in strict lockstep and emits only the left value.
 * Completes when the **first** of the two streams completes.
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits values from the left stream only.
 * @since 1.0.0
 * @category combinators
 */
export const zipLeft: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A, E | E2, R | R2> =>
    map(zip(self, that), (pair) => pair[0]),
);

/**
 * Zips two Fx streams in strict lockstep and emits only the right value.
 * Completes when the **first** of the two streams completes.
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits values from the right stream only.
 * @since 1.0.0
 * @category combinators
 */
export const zipRight: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A2, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A2, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A2, E | E2, R | R2> =>
    map(zip(self, that), (pair) => pair[1]),
);

type TaggedLeft<A> = { readonly _tag: "Left"; readonly value: A };
type TaggedRight<A2> = { readonly _tag: "Right"; readonly value: A2 };

/**
 * Merges two Fx streams and emits only values from the left stream.
 * Both streams run concurrently; completion when **both** complete.
 *
 * @param that - The second Fx stream (values are dropped).
 * @returns An Fx that emits only values from the left stream.
 * @since 1.0.0
 * @category combinators
 */
export const mergeLeft: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A, E | E2, R | R2> => {
    const taggedLeft = map(self, (a: A): TaggedLeft<A> => ({ _tag: "Left", value: a }));
    const taggedRight = map(that, (b: A2): TaggedRight<A2> => ({ _tag: "Right", value: b }));
    const merged = mergeAll(taggedLeft, taggedRight);
    const leftOnly = filter(merged, (x): x is TaggedLeft<A> => x._tag === "Left");
    return map(leftOnly, (x) => x.value) as Fx<A, E | E2, R | R2>;
  },
);

/**
 * Merges two Fx streams and emits only values from the right stream.
 * Both streams run concurrently; completion when **both** complete.
 *
 * @param that - The second Fx stream.
 * @returns An Fx that emits only values from the right stream.
 * @since 1.0.0
 * @category combinators
 */
export const mergeRight: {
  <A2, E2, R2>(that: Fx<A2, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A2, E | E2, R | R2>;
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A2, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, A2, E2, R2>(self: Fx<A, E, R>, that: Fx<A2, E2, R2>): Fx<A2, E | E2, R | R2> => {
    const taggedLeft = map(self, (a: A): TaggedLeft<A> => ({ _tag: "Left", value: a }));
    const taggedRight = map(that, (b: A2): TaggedRight<A2> => ({ _tag: "Right", value: b }));
    const merged = mergeAll(taggedLeft, taggedRight);
    const rightOnly = filter(merged, (x): x is TaggedRight<A2> => x._tag === "Right");
    return map(rightOnly, (x) => x.value) as Fx<A2, E | E2, R | R2>;
  },
);
