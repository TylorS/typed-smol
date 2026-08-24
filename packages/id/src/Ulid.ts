import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { DateTimes } from "./DateTimes.js";
import { RandomValues } from "./RandomValues.js";

export const Ulid = Schema.String.pipe(
  Schema.check(Schema.isULID()),
  Schema.brand("@typed/id/ULID"),
);
export type Ulid = typeof Ulid.Type;

export const isUlid: (value: string) => value is Ulid = Schema.is(Ulid);

type UlidSeed = Uint8Array & { length: 16 };

// Crockford's Base32
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = 2 ** 48 - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

export const ulid: Effect.Effect<Ulid, Cause.IllegalArgumentError, RandomValues | DateTimes> =
  Effect.gen(function* () {
    const now = yield* DateTimes.now;
    if (!Number.isSafeInteger(now) || now < 0 || now > TIME_MAX) {
      return yield* new Cause.IllegalArgumentError(
        `ULID timestamp must be a safe integer between 0 and ${TIME_MAX}, received ${now}`,
      );
    }

    const seed: UlidSeed = yield* RandomValues.call(16);
    return Ulid.make(encodeTime(now, TIME_LEN) + encodeRandom(seed));
  });

function encodeTime(now: number, len: number): string {
  let str = "";
  for (let i = len - 1; i >= 0; i--) {
    const mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str;
}

function encodeRandom(seed: UlidSeed): string {
  let str = "";
  for (let i = 0; i < RANDOM_LEN; i++) {
    str = str + ENCODING.charAt(seed[i] % ENCODING_LEN);
  }
  return str;
}
