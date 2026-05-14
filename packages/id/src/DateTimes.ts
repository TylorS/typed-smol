import * as Clock from "effect/Clock";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";

export class DateTimes extends Context.Service<DateTimes>()("@typed/id/DateTimes", {
  make: Effect.succeed({
    now: Effect.sync(() => Date.now()),
    date: Effect.sync(() => new Date()),
  }),
}) {
  static readonly now = Effect.flatMap(DateTimes, ({ now }) => now);
  static readonly date = Effect.flatMap(DateTimes, ({ date }) => date);

  static readonly Default = Layer.effect(DateTimes, DateTimes.make);

  static readonly Fixed = (baseDate: number | string | Date) =>
    Layer.effect(
      DateTimes,
      Effect.gen(function* () {
        const clock = yield* Clock.Clock;
        const base = new Date(baseDate);
        const baseN = BigInt(base.getTime());
        const startMillis = yield* clock.currentTimeMillis;
        const now = clock.currentTimeMillis.pipe(
          Effect.map((millis) =>
            // Use BigInt to avoid floating point precision issues which can break deterministic testing
            Number(baseN + BigInt(millis) - BigInt(startMillis)),
          ),
        );
        const date = now.pipe(Effect.map((millis) => new Date(millis)));

        return DateTimes.of({ now, date });
      }),
    );
}
