# API Reference: effect/unstable/cluster/Snowflake

- Import path: `effect/unstable/cluster/Snowflake`
- Source file: `packages/effect/src/unstable/cluster/Snowflake.ts`
- Function exports (callable): 7
- Non-function exports: 7

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `dateTime`
- `machineId`
- `make`
- `sequence`
- `Snowflake`
- `timestamp`
- `toParts`

## All Function Signatures

```ts
export declare const dateTime: (snowflake: Snowflake): DateTime.Utc;
export declare const machineId: (snowflake: Snowflake): MachineId;
export declare const make: (options: { readonly machineId: MachineId; readonly sequence: number; readonly timestamp: number; }): Snowflake;
export declare const sequence: (snowflake: Snowflake): number;
export declare const Snowflake: (input: string | bigint): Snowflake;
export declare const timestamp: (snowflake: Snowflake): number;
export declare const toParts: (snowflake: Snowflake): Snowflake.Parts;
```

## Other Exports (Non-Function)

- `constEpochMillis` (variable)
- `Generator` (class)
- `layerGenerator` (variable)
- `makeGenerator` (variable)
- `SnowflakeFromBigInt` (interface)
- `SnowflakeFromString` (interface)
- `TypeId` (type)
