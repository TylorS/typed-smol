import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import * as Context from "effect/Context";
import { uuidStringify } from "./_uuid-stringify.js";
import { DateTimes } from "./DateTimes.js";
import { RandomValues } from "./RandomValues.js";

export const Uuid7 = Schema.String.pipe(
  Schema.check(Schema.isUUID(7)),
  Schema.brand("@typed/id/UUID7"),
);
export type Uuid7 = typeof Uuid7.Type;

export const isUuid7: (value: string) => value is Uuid7 = Schema.is(Uuid7);

export type Uuid7Seed = {
  readonly timestamp: number;
  /** Unsigned 32-bit sequence integer in the range [0, 0xffffffff]. */
  readonly seq: number;
  readonly randomBytes: Uint8Array & { length: 16 };
};

const maximumTimestamp = 2 ** 48 - 1;

export class Uuid7State extends Context.Service<Uuid7State>()("@typed/id/Uuid7State", {
  make: Effect.gen(function* () {
    const { now } = yield* DateTimes;
    const getRandomValues = yield* RandomValues;
    const state = {
      msecs: Number.NEGATIVE_INFINITY,
      seq: 0,
    };

    function updateV7State(now: number, randomBytes: Uint8Array) {
      let msecs: number;
      let seq: number;

      if (now > state.msecs) {
        // Time has moved on! Pick a new random sequence number
        seq =
          ((randomBytes[6] << 24) |
            (randomBytes[7] << 16) |
            (randomBytes[8] << 8) |
            randomBytes[9]) >>>
          0;
        msecs = now;
      } else {
        // Bump sequence counter w/ 32-bit rollover
        seq = (state.seq + 1) >>> 0;
        msecs = state.msecs;

        // In case of rollover, bump timestamp to preserve monotonicity. This is
        // allowed by the RFC and should self-correct as the system clock catches
        // up. See https://www.rfc-editor.org/rfc/rfc9562.html#section-6.2-9.4
        if (seq === 0) {
          msecs++;
        }
      }

      state.msecs = msecs;
      state.seq = seq;
    }

    return {
      next: Effect.gen(function* () {
        const timestamp = yield* now;
        if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > maximumTimestamp) {
          return yield* new Cause.IllegalArgumentError(
            `UUIDv7 timestamp must be a safe integer between 0 and ${maximumTimestamp}, received ${timestamp}`,
          );
        }
        if (
          timestamp <= state.msecs &&
          state.msecs === maximumTimestamp &&
          state.seq === 0xffffffff
        ) {
          return yield* new Cause.IllegalArgumentError(
            "UUIDv7 sequence rollover exceeds its 48-bit timestamp field",
          );
        }
        const randomBytes = yield* getRandomValues(16);
        updateV7State(timestamp, randomBytes);
        return { timestamp: state.msecs, seq: state.seq, randomBytes };
      }),
    };
  }),
}) {
  static readonly next = Effect.gen(function* () {
    const { next } = yield* Uuid7State;
    return yield* next;
  });

  static readonly Default = Layer.effect(Uuid7State, Uuid7State.make).pipe(
    Layer.provide([DateTimes.Default, RandomValues.Default]),
  );
}

export const uuid7: Effect.Effect<Uuid7, Cause.IllegalArgumentError, Uuid7State> = Effect.map(
  Uuid7State.next,
  uuid7FromSeed,
);

function uuid7FromSeed({ randomBytes, seq, timestamp }: Uuid7Seed): Uuid7 {
  const result = new Uint8Array(16);

  // byte 0-5: timestamp (48 bits)
  result[0] = (timestamp / 0x10000000000) & 0xff;
  result[1] = (timestamp / 0x100000000) & 0xff;
  result[2] = (timestamp / 0x1000000) & 0xff;
  result[3] = (timestamp / 0x10000) & 0xff;
  result[4] = (timestamp / 0x100) & 0xff;
  result[5] = timestamp & 0xff;

  // byte 6: `version` (4 bits) | sequence bits 28-31 (4 bits)
  result[6] = 0x70 | ((seq >>> 28) & 0x0f);

  // byte 7: sequence bits 20-27 (8 bits)
  result[7] = (seq >>> 20) & 0xff;

  // byte 8: `variant` (2 bits) | sequence bits 14-19 (6 bits)
  result[8] = 0x80 | ((seq >>> 14) & 0x3f);

  // byte 9: sequence bits 6-13 (8 bits)
  result[9] = (seq >>> 6) & 0xff;

  // byte 10: sequence bits 0-5 (6 bits) | random (2 bits)
  result[10] = ((seq << 2) & 0xff) | (randomBytes[10] & 0x03);

  // bytes 11-15: random (40 bits)
  result[11] = randomBytes[11];
  result[12] = randomBytes[12];
  result[13] = randomBytes[13];
  result[14] = randomBytes[14];
  result[15] = randomBytes[15];

  return Uuid7.make(uuidStringify(result));
}
