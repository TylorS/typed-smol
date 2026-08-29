import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import * as Context from "effect/Context";
import { sha512 } from "./_sha.js";
import { DateTimes } from "./DateTimes.js";
import { RandomValues } from "./RandomValues.js";

// Constants
const DEFAULT_LENGTH = 24;
const BIG_LENGTH = 32;
const INITIAL_COUNT_MAX = 476782367;

// Schema
export const Cuid = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-z][0-9a-z]{23}$/)),
  Schema.brand("@typed/id/CUID"),
);
export type Cuid = Schema.Schema.Type<typeof Cuid>;

export const isCuid: (value: string) => value is Cuid = Schema.is(Cuid);

// Types
export type CuidSeed = {
  readonly timestamp: number;
  readonly counter: number;
  readonly random: Uint8Array & { readonly length: 32 };
  readonly fingerprint: string;
};

export class CuidState extends Context.Service<CuidState>()("@typed/id/CuidState", {
  make: (envData: string) =>
    Effect.gen(function* () {
      const { now } = yield* DateTimes;
      const getRandomValues = yield* RandomValues;
      const initialBytes = yield* getRandomValues(4);
      const initialValue =
        Math.abs(
          (initialBytes[0] << 24) |
            (initialBytes[1] << 16) |
            (initialBytes[2] << 8) |
            initialBytes[3],
        ) % INITIAL_COUNT_MAX;

      // Derive a stable discriminator from caller-provided environment data
      const fingerprint = (yield* hash(envData)).substring(0, BIG_LENGTH);

      let counter = initialValue;

      return {
        next: Effect.gen(function* () {
          const timestamp = yield* now;
          const random = yield* getRandomValues(32);
          return {
            timestamp,
            counter: counter++,
            random,
            fingerprint,
          } satisfies CuidSeed;
        }),
      };
    }),
}) {
  static readonly next = Effect.gen(function* () {
    const { next } = yield* CuidState;
    return yield* next;
  });

  static readonly Default = Layer.effect(CuidState, CuidState.make("node")).pipe(
    Layer.provide([DateTimes.Default, RandomValues.Default]),
  );
}

export const cuid: Effect.Effect<Cuid, never, CuidState> = Effect.flatMap(
  CuidState.next,
  cuidFromSeed,
);

// Utilities
const LETTER_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const BODY_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const LETTER_DOMAIN = "@typed/id/cuid/letter";
const BODY_DOMAIN = "@typed/id/cuid/body";
const encoder = new TextEncoder();

function hash(input: string): Effect.Effect<string> {
  return Effect.map(sha512(encoder.encode(input)), (buffer) => {
    const view = new Uint8Array(buffer);
    let value = 0n;
    for (const byte of view) {
      value = (value << 8n) + BigInt(byte);
    }
    // Drop the first character because it will bias the histogram to the left
    return value.toString(36).slice(1);
  });
}

function sample(
  domain: string,
  alphabet: string,
  length: number,
  canonicalInput: Uint8Array,
): Effect.Effect<string> {
  return Effect.gen(function* () {
    const limit = Math.floor(256 / alphabet.length) * alphabet.length;
    let value = "";

    for (let block = 0; value.length < length; block++) {
      const prefix = encoder.encode(`${domain}\0${block.toString(10)}\0`);
      const input = new Uint8Array(prefix.length + canonicalInput.length);
      input.set(prefix);
      input.set(canonicalInput, prefix.length);
      const digest = new Uint8Array(yield* sha512(input));

      for (const byte of digest) {
        if (byte >= limit) continue;
        value += alphabet[byte % alphabet.length];
        if (value.length === length) break;
      }
    }

    return value;
  });
}

function cuidFromSeed({ counter, fingerprint, random, timestamp }: CuidSeed): Effect.Effect<Cuid> {
  return Effect.gen(function* () {
    const randomHex = Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const canonicalInput = encoder.encode(
      [timestamp.toString(36), counter.toString(36), fingerprint, randomHex].join("\0"),
    );
    const firstLetter = yield* sample(LETTER_DOMAIN, LETTER_ALPHABET, 1, canonicalInput);
    const body = yield* sample(BODY_DOMAIN, BODY_ALPHABET, DEFAULT_LENGTH - 1, canonicalInput);

    return Cuid.make(firstLetter + body);
  });
}
