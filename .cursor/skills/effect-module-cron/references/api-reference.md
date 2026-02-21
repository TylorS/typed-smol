# API Reference: effect/Cron

- Import path: `effect/Cron`
- Source file: `packages/effect/src/Cron.ts`
- Function exports (callable): 10
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `equals`
- `Equivalence`
- `isCron`
- `isCronParseError`
- `make`
- `match`
- `next`
- `parse`
- `parseUnsafe`
- `sequence`

## All Function Signatures

```ts
export declare const equals: (that: Cron): (self: Cron) => boolean; // overload 1
export declare const equals: (self: Cron, that: Cron): boolean; // overload 2
export declare const Equivalence: (self: Cron, that: Cron): boolean;
export declare const isCron: (u: unknown): u is Cron;
export declare const isCronParseError: (u: unknown): u is CronParseError;
export declare const make: (values: { readonly seconds?: Iterable<number> | undefined; readonly minutes: Iterable<number>; readonly hours: Iterable<number>; readonly days: Iterable<number>; readonly months: Iterable<number>; readonly weekdays: Iterable<number>; readonly tz?: DateTime.TimeZone | undefined; }): Cron;
export declare const match: (cron: Cron, date: DateTime.DateTime.Input): boolean;
export declare const next: (cron: Cron, now?: DateTime.DateTime.Input): Date;
export declare const parse: (cron: string, tz?: DateTime.TimeZone | string): Result.Result<Cron, CronParseError>;
export declare const parseUnsafe: (cron: string, tz?: DateTime.TimeZone | string): Cron;
export declare const sequence: (cron: Cron, now?: DateTime.DateTime.Input): IterableIterator<Date>;
```

## Other Exports (Non-Function)

- `Cron` (interface)
- `CronParseError` (class)
