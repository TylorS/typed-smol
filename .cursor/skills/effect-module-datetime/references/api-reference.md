# API Reference: effect/DateTime

- Import path: `effect/DateTime`
- Source file: `packages/effect/src/DateTime.ts`
- Function exports (callable): 82
- Non-function exports: 10

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `add`
- `addDuration`
- `between`
- `clamp`
- `distance`
- `endOf`
- `Equivalence`
- `format`
- `formatIntl`
- `formatIso`
- `formatIsoDate`
- `formatIsoDateUtc`
- `formatIsoOffset`
- `formatIsoZoned`
- `formatLocal`
- `formatUtc`
- `fromDateUnsafe`
- `getPart`

## All Function Signatures

```ts
export declare const add: (parts: Partial<DateTime.PartsForMath>): <A extends DateTime>(self: A) => A; // overload 1
export declare const add: <A extends DateTime>(self: A, parts: Partial<DateTime.PartsForMath>): A; // overload 2
export declare const addDuration: (duration: Duration.Input): <A extends DateTime>(self: A) => A; // overload 1
export declare const addDuration: <A extends DateTime>(self: A, duration: Duration.Input): A; // overload 2
export declare const between: (options: { minimum: DateTime; maximum: DateTime; }): (self: DateTime) => boolean; // overload 1
export declare const between: (self: DateTime, options: { minimum: DateTime; maximum: DateTime; }): boolean; // overload 2
export declare const clamp: <Min extends DateTime, Max extends DateTime>(options: { readonly minimum: Min; readonly maximum: Max; }): <A extends DateTime>(self: A) => A | Min | Max; // overload 1
export declare const clamp: <A extends DateTime, Min extends DateTime, Max extends DateTime>(self: A, options: { readonly minimum: Min; readonly maximum: Max; }): A | Min | Max; // overload 2
export declare const distance: (other: DateTime): (self: DateTime) => Duration.Duration; // overload 1
export declare const distance: (self: DateTime, other: DateTime): Duration.Duration; // overload 2
export declare const endOf: (part: DateTime.UnitSingular, options?: { readonly weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined; }): <A extends DateTime>(self: A) => A; // overload 1
export declare const endOf: <A extends DateTime>(self: A, part: DateTime.UnitSingular, options?: { readonly weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined; }): A; // overload 2
export declare const Equivalence: (self: DateTime, that: DateTime): boolean;
export declare const format: (options?: (Intl.DateTimeFormatOptions & { readonly locale?: string | undefined; }) | undefined): (self: DateTime) => string; // overload 1
export declare const format: (self: DateTime, options?: (Intl.DateTimeFormatOptions & { readonly locale?: string | undefined; }) | undefined): string; // overload 2
export declare const formatIntl: (format: Intl.DateTimeFormat): (self: DateTime) => string; // overload 1
export declare const formatIntl: (self: DateTime, format: Intl.DateTimeFormat): string; // overload 2
export declare const formatIso: (self: DateTime): string;
export declare const formatIsoDate: (self: DateTime): string;
export declare const formatIsoDateUtc: (self: DateTime): string;
export declare const formatIsoOffset: (self: DateTime): string;
export declare const formatIsoZoned: (self: Zoned): string;
export declare const formatLocal: (options?: (Intl.DateTimeFormatOptions & { readonly locale?: string | undefined; }) | undefined): (self: DateTime) => string; // overload 1
export declare const formatLocal: (self: DateTime, options?: (Intl.DateTimeFormatOptions & { readonly locale?: string | undefined; }) | undefined): string; // overload 2
export declare const formatUtc: (options?: (Intl.DateTimeFormatOptions & { readonly locale?: string | undefined; }) | undefined): (self: DateTime) => string; // overload 1
export declare const formatUtc: (self: DateTime, options?: (Intl.DateTimeFormatOptions & { readonly locale?: string | undefined; }) | undefined): string; // overload 2
export declare const fromDateUnsafe: (date: Date): Utc;
export declare const getPart: (part: keyof DateTime.PartsWithWeekday): (self: DateTime) => number; // overload 1
export declare const getPart: (self: DateTime, part: keyof DateTime.PartsWithWeekday): number; // overload 2
export declare const getPartUtc: (part: keyof DateTime.PartsWithWeekday): (self: DateTime) => number; // overload 1
export declare const getPartUtc: (self: DateTime, part: keyof DateTime.PartsWithWeekday): number; // overload 2
export declare const isDateTime: (u: unknown): u is DateTime;
export declare const isFuture: (self: DateTime): Effect.Effect<boolean>;
export declare const isFutureUnsafe: (self: DateTime): boolean;
export declare const isGreaterThan: (that: DateTime): (self: DateTime) => boolean; // overload 1
export declare const isGreaterThan: (self: DateTime, that: DateTime): boolean; // overload 2
export declare const isGreaterThanOrEqualTo: (that: DateTime): (self: DateTime) => boolean; // overload 1
export declare const isGreaterThanOrEqualTo: (self: DateTime, that: DateTime): boolean; // overload 2
export declare const isLessThan: (that: DateTime): (self: DateTime) => boolean; // overload 1
export declare const isLessThan: (self: DateTime, that: DateTime): boolean; // overload 2
export declare const isLessThanOrEqualTo: (that: DateTime): (self: DateTime) => boolean; // overload 1
export declare const isLessThanOrEqualTo: (self: DateTime, that: DateTime): boolean; // overload 2
export declare const isPast: (self: DateTime): Effect.Effect<boolean>;
export declare const isPastUnsafe: (self: DateTime): boolean;
export declare const isTimeZone: (u: unknown): u is TimeZone;
export declare const isTimeZoneNamed: (u: unknown): u is TimeZone.Named;
export declare const isTimeZoneOffset: (u: unknown): u is TimeZone.Offset;
export declare const isUtc: (self: DateTime): self is Utc;
export declare const isZoned: (self: DateTime): self is Zoned;
export declare const layerCurrentZone: (resource: NoInfer<TimeZone>): Layer.Layer<CurrentTimeZone>;
export declare const layerCurrentZoneNamed: (zoneId: string): Layer.Layer<CurrentTimeZone, IllegalArgumentError>;
export declare const layerCurrentZoneOffset: (offset: number): Layer.Layer<CurrentTimeZone>;
export declare const make: <A extends DateTime.Input>(input: A): DateTime.PreserveZone<A> | undefined;
export declare const makeUnsafe: <A extends DateTime.Input>(input: A): DateTime.PreserveZone<A>;
export declare const makeZoned: (input: DateTime.Input, options?: { readonly timeZone?: number | string | TimeZone | undefined; readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): Zoned | undefined;
export declare const makeZonedFromString: (input: string): Zoned | undefined;
export declare const makeZonedUnsafe: (input: DateTime.Input, options?: { readonly timeZone?: number | string | TimeZone | undefined; readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): Zoned;
export declare const mapEpochMillis: (f: (millis: number) => number): <A extends DateTime>(self: A) => A; // overload 1
export declare const mapEpochMillis: <A extends DateTime>(self: A, f: (millis: number) => number): A; // overload 2
export declare const match: <A, B>(options: { readonly onUtc: (_: Utc) => A; readonly onZoned: (_: Zoned) => B; }): (self: DateTime) => A | B; // overload 1
export declare const match: <A, B>(self: DateTime, options: { readonly onUtc: (_: Utc) => A; readonly onZoned: (_: Zoned) => B; }): A | B; // overload 2
export declare const max: <That extends DateTime>(that: That): <Self extends DateTime>(self: Self) => Self | That; // overload 1
export declare const max: <Self extends DateTime, That extends DateTime>(self: Self, that: That): Self | That; // overload 2
export declare const min: <That extends DateTime>(that: That): <Self extends DateTime>(self: Self) => Self | That; // overload 1
export declare const min: <Self extends DateTime, That extends DateTime>(self: Self, that: That): Self | That; // overload 2
export declare const mutate: (f: (date: Date) => void, options?: { readonly disambiguation?: Disambiguation | undefined; }): <A extends DateTime>(self: A) => A; // overload 1
export declare const mutate: <A extends DateTime>(self: A, f: (date: Date) => void, options?: { readonly disambiguation?: Disambiguation | undefined; }): A; // overload 2
export declare const mutateUtc: (f: (date: Date) => void): <A extends DateTime>(self: A) => A; // overload 1
export declare const mutateUtc: <A extends DateTime>(self: A, f: (date: Date) => void): A; // overload 2
export declare const nearest: (part: DateTime.UnitSingular, options?: { readonly weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined; }): <A extends DateTime>(self: A) => A; // overload 1
export declare const nearest: <A extends DateTime>(self: A, part: DateTime.UnitSingular, options?: { readonly weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined; }): A; // overload 2
export declare const nowUnsafe: (): Utc;
export declare const Order: (self: DateTime, that: DateTime): Ordering;
export declare const removeTime: (self: DateTime): Utc;
export declare const setParts: (parts: Partial<DateTime.PartsWithWeekday>): <A extends DateTime>(self: A) => A; // overload 1
export declare const setParts: <A extends DateTime>(self: A, parts: Partial<DateTime.PartsWithWeekday>): A; // overload 2
export declare const setPartsUtc: (parts: Partial<DateTime.PartsWithWeekday>): <A extends DateTime>(self: A) => A; // overload 1
export declare const setPartsUtc: <A extends DateTime>(self: A, parts: Partial<DateTime.PartsWithWeekday>): A; // overload 2
export declare const setZone: (zone: TimeZone, options?: { readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): (self: DateTime) => Zoned; // overload 1
export declare const setZone: (self: DateTime, zone: TimeZone, options?: { readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): Zoned; // overload 2
export declare const setZoneCurrent: (self: DateTime): Effect.Effect<Zoned, never, CurrentTimeZone>;
export declare const setZoneNamed: (zoneId: string, options?: { readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): (self: DateTime) => Zoned | undefined; // overload 1
export declare const setZoneNamed: (self: DateTime, zoneId: string, options?: { readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): Zoned | undefined; // overload 2
export declare const setZoneNamedUnsafe: (zoneId: string, options?: { readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): (self: DateTime) => Zoned; // overload 1
export declare const setZoneNamedUnsafe: (self: DateTime, zoneId: string, options?: { readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): Zoned; // overload 2
export declare const setZoneOffset: (offset: number, options?: { readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): (self: DateTime) => Zoned; // overload 1
export declare const setZoneOffset: (self: DateTime, offset: number, options?: { readonly adjustForTimeZone?: boolean | undefined; readonly disambiguation?: Disambiguation | undefined; }): Zoned; // overload 2
export declare const startOf: (part: DateTime.UnitSingular, options?: { readonly weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined; }): <A extends DateTime>(self: A) => A; // overload 1
export declare const startOf: <A extends DateTime>(self: A, part: DateTime.UnitSingular, options?: { readonly weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined; }): A; // overload 2
export declare const subtract: (parts: Partial<DateTime.PartsForMath>): <A extends DateTime>(self: A) => A; // overload 1
export declare const subtract: <A extends DateTime>(self: A, parts: Partial<DateTime.PartsForMath>): A; // overload 2
export declare const subtractDuration: (duration: Duration.Input): <A extends DateTime>(self: A) => A; // overload 1
export declare const subtractDuration: <A extends DateTime>(self: A, duration: Duration.Input): A; // overload 2
export declare const toDate: (self: DateTime): Date;
export declare const toDateUtc: (self: DateTime): Date;
export declare const toEpochMillis: (self: DateTime): number;
export declare const toParts: (self: DateTime): DateTime.PartsWithWeekday;
export declare const toPartsUtc: (self: DateTime): DateTime.PartsWithWeekday;
export declare const toUtc: (self: DateTime): Utc;
export declare const withCurrentZone: (value: TimeZone): <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, Exclude<R, CurrentTimeZone>>; // overload 1
export declare const withCurrentZone: <A, E, R>(self: Effect.Effect<A, E, R>, value: TimeZone): Effect.Effect<A, E, Exclude<R, CurrentTimeZone>>; // overload 2
export declare const withCurrentZoneLocal: <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, Exclude<R, CurrentTimeZone>>;
export declare const withCurrentZoneNamed: (zone: string): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E | IllegalArgumentError, Exclude<R, CurrentTimeZone>>; // overload 1
export declare const withCurrentZoneNamed: <A, E, R>(effect: Effect.Effect<A, E, R>, zone: string): Effect.Effect<A, E | IllegalArgumentError, Exclude<R, CurrentTimeZone>>; // overload 2
export declare const withCurrentZoneOffset: (offset: number): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, Exclude<R, CurrentTimeZone>>; // overload 1
export declare const withCurrentZoneOffset: <A, E, R>(effect: Effect.Effect<A, E, R>, offset: number): Effect.Effect<A, E, Exclude<R, CurrentTimeZone>>; // overload 2
export declare const withDate: <A>(f: (date: Date) => A): (self: DateTime) => A; // overload 1
export declare const withDate: <A>(self: DateTime, f: (date: Date) => A): A; // overload 2
export declare const withDateUtc: <A>(f: (date: Date) => A): (self: DateTime) => A; // overload 1
export declare const withDateUtc: <A>(self: DateTime, f: (date: Date) => A): A; // overload 2
export declare const zonedOffset: (self: Zoned): number;
export declare const zonedOffsetIso: (self: Zoned): string;
export declare const zoneFromString: (zone: string): TimeZone | undefined;
export declare const zoneMakeLocal: (): TimeZone.Named;
export declare const zoneMakeNamed: (zoneId: string): TimeZone.Named | undefined;
export declare const zoneMakeNamedEffect: (zoneId: string): Effect.Effect<TimeZone.Named, IllegalArgumentError>;
export declare const zoneMakeNamedUnsafe: (zoneId: string): TimeZone.Named;
export declare const zoneMakeOffset: (offset: number): TimeZone.Offset;
export declare const zoneToString: (self: TimeZone): string;
```

## Other Exports (Non-Function)

- `CurrentTimeZone` (class)
- `DateTime` (type)
- `Disambiguation` (type)
- `layerCurrentZoneLocal` (variable)
- `now` (variable)
- `nowAsDate` (variable)
- `nowInCurrentZone` (variable)
- `TimeZone` (type)
- `Utc` (interface)
- `Zoned` (interface)
