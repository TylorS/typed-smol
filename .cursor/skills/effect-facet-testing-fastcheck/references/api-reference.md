# API Reference: effect/testing/FastCheck

- Import path: `effect/testing/FastCheck`
- Source file: `packages/effect/src/testing/FastCheck.ts`
- Function exports (callable): 99
- Non-function exports: 113

## Purpose

This module provides a re-export of the fast-check library for property-based testing. Fast-check is a property-based testing framework that generates random test cases to validate that properties hold true for a wide range of inputs.

## Key Function Exports

- `anything`
- `array`
- `assert`
- `asyncDefaultReportMessage`
- `asyncModelRun`
- `asyncProperty`
- `asyncStringify`
- `base64String`
- `bigInt`
- `bigInt64Array`
- `bigUint64Array`
- `boolean`
- `check`
- `clone`
- `cloneIfNeeded`
- `commands`
- `compareBooleanFunc`
- `compareFunc`

## All Function Signatures

```ts
export declare const anything: (): Arbitrary<unknown>; // overload 1
export declare const anything: (constraints: ObjectConstraints): Arbitrary<unknown>; // overload 2
export declare const array: <T>(arb: Arbitrary<T>, constraints?: ArrayConstraints): Arbitrary<T[]>;
export declare const assert: <Ts>(property: IAsyncProperty<Ts>, params?: Parameters<Ts>): Promise<void>; // overload 1
export declare const assert: <Ts>(property: IProperty<Ts>, params?: Parameters<Ts>): void; // overload 2
export declare const assert: <Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): Promise<void> | void; // overload 3
export declare const asyncDefaultReportMessage: <Ts>(out: RunDetails<Ts> & { failed: false; }): Promise<undefined>; // overload 1
export declare const asyncDefaultReportMessage: <Ts>(out: RunDetails<Ts> & { failed: true; }): Promise<string>; // overload 2
export declare const asyncDefaultReportMessage: <Ts>(out: RunDetails<Ts>): Promise<string | undefined>; // overload 3
export declare const asyncModelRun: <Model extends object, Real, CheckAsync extends boolean, InitialModel extends Model>(s: ModelRunSetup<InitialModel, Real> | ModelRunAsyncSetup<InitialModel, Real>, cmds: Iterable<AsyncCommand<Model, Real, CheckAsync>>): Promise<void>;
export declare const asyncProperty: <Ts extends [unknown, ...unknown[]]>(...args: [...arbitraries: { [K in keyof Ts]: Arbitrary<Ts[K]>; }, predicate: (...args: Ts) => Promise<boolean | void>]): IAsyncPropertyWithHooks<Ts>;
export declare const asyncStringify: <Ts>(value: Ts): Promise<string>;
export declare const base64String: (constraints?: StringSharedConstraints): Arbitrary<string>;
export declare const bigInt: (): Arbitrary<bigint>; // overload 1
export declare const bigInt: (min: bigint, max: bigint): Arbitrary<bigint>; // overload 2
export declare const bigInt: (constraints: BigIntConstraints): Arbitrary<bigint>; // overload 3
export declare const bigInt: (...args: [] | [bigint, bigint] | [BigIntConstraints]): Arbitrary<bigint>; // overload 4
export declare const bigInt64Array: (constraints?: BigIntArrayConstraints): Arbitrary<BigInt64Array<ArrayBuffer>>;
export declare const bigUint64Array: (constraints?: BigIntArrayConstraints): Arbitrary<BigUint64Array<ArrayBuffer>>;
export declare const boolean: (): Arbitrary<boolean>;
export declare const check: <Ts>(property: IAsyncProperty<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>>; // overload 1
export declare const check: <Ts>(property: IProperty<Ts>, params?: Parameters<Ts>): RunDetails<Ts>; // overload 2
export declare const check: <Ts>(property: IRawProperty<Ts>, params?: Parameters<Ts>): Promise<RunDetails<Ts>> | RunDetails<Ts>; // overload 3
export declare const clone: <T, N extends number>(arb: Arbitrary<T>, numValues: N): Arbitrary<CloneValue<T, N>>;
export declare const cloneIfNeeded: <T>(instance: T): T;
export declare const commands: <Model extends object, Real, CheckAsync extends boolean>(commandArbs: Arbitrary<AsyncCommand<Model, Real, CheckAsync>>[], constraints?: CommandsContraints): Arbitrary<Iterable<AsyncCommand<Model, Real, CheckAsync>>>; // overload 1
export declare const commands: <Model extends object, Real>(commandArbs: Arbitrary<Command<Model, Real>>[], constraints?: CommandsContraints): Arbitrary<Iterable<Command<Model, Real>>>; // overload 2
export declare const compareBooleanFunc: <T>(): Arbitrary<(a: T, b: T) => boolean>;
export declare const compareFunc: <T>(): Arbitrary<(a: T, b: T) => number>;
export declare const configureGlobal: (parameters: GlobalParameters): void;
export declare const constant: <const T>(value: T): Arbitrary<T>;
export declare const constantFrom: <const T = never>(...values: T[]): Arbitrary<T>; // overload 1
export declare const constantFrom: <TArgs extends any[] | [any]>(...values: TArgs): Arbitrary<TArgs[number]>; // overload 2
export declare const context: (): Arbitrary<ContextValue>;
export declare const createDepthIdentifier: (): DepthIdentifier;
export declare const date: (constraints?: DateConstraints): Arbitrary<Date>;
export declare const defaultReportMessage: <Ts>(out: RunDetails<Ts> & { failed: false; }): undefined; // overload 1
export declare const defaultReportMessage: <Ts>(out: RunDetails<Ts> & { failed: true; }): string; // overload 2
export declare const defaultReportMessage: <Ts>(out: RunDetails<Ts>): string | undefined; // overload 3
export declare const dictionary: <T>(keyArb: Arbitrary<string>, valueArb: Arbitrary<T>, constraints?: DictionaryConstraints): Arbitrary<Record<string, T>>; // overload 1
export declare const dictionary: <K extends PropertyKey, V>(keyArb: Arbitrary<K>, valueArb: Arbitrary<V>, constraints?: DictionaryConstraints): Arbitrary<Record<K, V>>; // overload 2
export declare const domain: (constraints?: DomainConstraints): Arbitrary<string>;
export declare const double: (constraints?: DoubleConstraints): Arbitrary<number>;
export declare const emailAddress: (constraints?: EmailAddressConstraints): Arbitrary<string>;
export declare const entityGraph: <TEntityFields, TEntityRelations extends EntityRelations<TEntityFields>>(arbitraries: Arbitraries<TEntityFields>, relations: TEntityRelations, constraints?: EntityGraphContraints<TEntityFields>): Arbitrary<EntityGraphValue<TEntityFields, TEntityRelations>>;
export declare const falsy: <TConstraints extends FalsyContraints>(constraints?: TConstraints): Arbitrary<FalsyValue<TConstraints>>;
export declare const float: (constraints?: FloatConstraints): Arbitrary<number>;
export declare const float32Array: (constraints?: Float32ArrayConstraints): Arbitrary<Float32Array<ArrayBuffer>>;
export declare const float64Array: (constraints?: Float64ArrayConstraints): Arbitrary<Float64Array<ArrayBuffer>>;
export declare const func: <TArgs extends any[], TOut>(arb: Arbitrary<TOut>): Arbitrary<(...args: TArgs) => TOut>;
export declare const gen: (): Arbitrary<GeneratorValue>;
export declare const getDepthContextFor: (contextMeta: DepthContext | DepthIdentifier | string | undefined): DepthContext;
export declare const hasAsyncToStringMethod: <T>(instance: T): instance is T & WithAsyncToStringMethod;
export declare const hasCloneMethod: <T>(instance: T | WithCloneMethod<T>): instance is WithCloneMethod<T>;
export declare const hash: (repr: string): number;
export declare const hasToStringMethod: <T>(instance: T): instance is T & WithToStringMethod;
export declare const infiniteStream: <T>(arb: Arbitrary<T>, constraints?: InfiniteStreamConstraints): Arbitrary<Stream<T>>;
export declare const int16Array: (constraints?: IntArrayConstraints): Arbitrary<Int16Array<ArrayBuffer>>;
export declare const int32Array: (constraints?: IntArrayConstraints): Arbitrary<Int32Array<ArrayBuffer>>;
export declare const int8Array: (constraints?: IntArrayConstraints): Arbitrary<Int8Array<ArrayBuffer>>;
export declare const integer: (constraints?: IntegerConstraints): Arbitrary<number>;
export declare const ipV4: (): Arbitrary<string>;
export declare const ipV4Extended: (): Arbitrary<string>;
export declare const ipV6: (): Arbitrary<string>;
export declare const json: (constraints?: JsonSharedConstraints): Arbitrary<string>;
export declare const jsonValue: (constraints?: JsonSharedConstraints): Arbitrary<JsonValue>;
export declare const letrec: <T>(builder: T extends Record<string, unknown> ? LetrecTypedBuilder<T> : never): LetrecValue<T>; // overload 1
export declare const letrec: <T>(builder: LetrecLooselyTypedBuilder<T>): LetrecValue<T>; // overload 2
export declare const limitShrink: <T>(arbitrary: Arbitrary<T>, maxShrinks: number): Arbitrary<T>;
export declare const lorem: (constraints?: LoremConstraints): Arbitrary<string>;
export declare const map: <K, V>(keyArb: Arbitrary<K>, valueArb: Arbitrary<V>, constraints?: MapConstraints): Arbitrary<Map<K, V>>;
export declare const mapToConstant: <T>(...entries: { num: number; build: (idInGroup: number) => T; }[]): Arbitrary<T>;
export declare const maxSafeInteger: (): Arbitrary<number>;
export declare const maxSafeNat: (): Arbitrary<number>;
export declare const memo: <T>(builder: (maxDepth: number) => Arbitrary<T>): Memo<T>;
export declare const mixedCase: (stringArb: Arbitrary<string>, constraints?: MixedCaseConstraints): Arbitrary<string>;
export declare const modelRun: <Model extends object, Real, InitialModel extends Model>(s: ModelRunSetup<InitialModel, Real>, cmds: Iterable<Command<Model, Real>>): void;
export declare const nat: (): Arbitrary<number>; // overload 1
export declare const nat: (max: number): Arbitrary<number>; // overload 2
export declare const nat: (constraints: NatConstraints): Arbitrary<number>; // overload 3
export declare const nat: (arg?: number | NatConstraints): Arbitrary<number>; // overload 4
export declare const noBias: <T>(arb: Arbitrary<T>): Arbitrary<T>;
export declare const noShrink: <T>(arb: Arbitrary<T>): Arbitrary<T>;
export declare const object: (): Arbitrary<Record<string, unknown>>; // overload 1
export declare const object: (constraints: ObjectConstraints): Arbitrary<Record<string, unknown>>; // overload 2
export declare const oneof: <Ts extends MaybeWeightedArbitrary<unknown>[]>(...arbs: Ts): Arbitrary<OneOfValue<Ts>>; // overload 1
export declare const oneof: <Ts extends MaybeWeightedArbitrary<unknown>[]>(constraints: OneOfConstraints, ...arbs: Ts): Arbitrary<OneOfValue<Ts>>; // overload 2
export declare const option: <T, TNil = null>(arb: Arbitrary<T>, constraints?: OptionConstraints<TNil>): Arbitrary<T | TNil>;
export declare const pre: (expectTruthy: boolean): asserts expectTruthy;
export declare const property: <Ts extends [unknown, ...unknown[]]>(...args: [...arbitraries: { [K in keyof Ts]: Arbitrary<Ts[K]>; }, predicate: (...args: Ts) => boolean | void]): IPropertyWithHooks<Ts>;
export declare const readConfigureGlobal: (): GlobalParameters;
export declare const record: <T, K extends keyof T = keyof T>(model: { [K in keyof T]: Arbitrary<T[K]>; }, constraints?: RecordConstraints<K>): Arbitrary<RecordValue<T, K>>;
export declare const resetConfigureGlobal: (): void;
export declare const sample: <Ts>(generator: IRawProperty<Ts> | Arbitrary<Ts>, params?: Parameters<Ts> | number): Ts[];
export declare const scheduledModelRun: <Model extends object, Real, CheckAsync extends boolean, InitialModel extends Model>(scheduler: Scheduler, s: ModelRunSetup<InitialModel, Real> | ModelRunAsyncSetup<InitialModel, Real>, cmds: Iterable<AsyncCommand<Model, Real, CheckAsync>>): Promise<void>;
export declare const scheduler: <TMetaData = unknown>(constraints?: SchedulerConstraints): Arbitrary<Scheduler<TMetaData>>;
export declare const schedulerFor: <TMetaData = unknown>(constraints?: SchedulerConstraints): (_strs: TemplateStringsArray, ...ordering: number[]) => Scheduler<TMetaData>; // overload 1
export declare const schedulerFor: <TMetaData = unknown>(customOrdering: number[], constraints?: SchedulerConstraints): Scheduler<TMetaData>; // overload 2
export declare const set: <T>(arb: Arbitrary<T>, constraints?: SetConstraints): Arbitrary<Set<T>>;
export declare const shuffledSubarray: <T>(originalArray: T[], constraints?: ShuffledSubarrayConstraints): Arbitrary<T[]>;
export declare const sparseArray: <T>(arb: Arbitrary<T>, constraints?: SparseArrayConstraints): Arbitrary<T[]>;
export declare const statistics: <Ts>(generator: IRawProperty<Ts> | Arbitrary<Ts>, classify: (v: Ts) => string | string[], params?: Parameters<Ts> | number): void;
export declare const stream: <T>(g: IterableIterator<T>): Stream<T>;
export declare const string: (constraints?: StringConstraints): Arbitrary<string>;
export declare const stringify: <Ts>(value: Ts): string;
export declare const stringMatching: (regex: RegExp, constraints?: StringMatchingConstraints): Arbitrary<string>;
export declare const subarray: <T>(originalArray: T[], constraints?: SubarrayConstraints): Arbitrary<T[]>;
export declare const tuple: <Ts extends unknown[]>(...arbs: { [K in keyof Ts]: Arbitrary<Ts[K]>; }): Arbitrary<Ts>;
export declare const uint16Array: (constraints?: IntArrayConstraints): Arbitrary<Uint16Array<ArrayBuffer>>;
export declare const uint32Array: (constraints?: IntArrayConstraints): Arbitrary<Uint32Array<ArrayBuffer>>;
export declare const uint8Array: (constraints?: IntArrayConstraints): Arbitrary<Uint8Array<ArrayBuffer>>;
export declare const uint8ClampedArray: (constraints?: IntArrayConstraints): Arbitrary<Uint8ClampedArray<ArrayBuffer>>;
export declare const ulid: (): Arbitrary<string>;
export declare const uniqueArray: <T, U>(arb: Arbitrary<T>, constraints?: UniqueArrayConstraintsRecommended<T, U>): Arbitrary<T[]>; // overload 1
export declare const uniqueArray: <T>(arb: Arbitrary<T>, constraints: UniqueArrayConstraintsCustomCompare<T>): Arbitrary<T[]>; // overload 2
export declare const uniqueArray: <T, U>(arb: Arbitrary<T>, constraints: UniqueArrayConstraintsCustomCompareSelect<T, U>): Arbitrary<T[]>; // overload 3
export declare const uniqueArray: <T, U>(arb: Arbitrary<T>, constraints: UniqueArrayConstraints<T, U>): Arbitrary<T[]>; // overload 4
export declare const uuid: (constraints?: UuidConstraints): Arbitrary<string>;
export declare const webAuthority: (constraints?: WebAuthorityConstraints): Arbitrary<string>;
export declare const webFragments: (constraints?: WebFragmentsConstraints): Arbitrary<string>;
export declare const webPath: (constraints?: WebPathConstraints): Arbitrary<string>;
export declare const webQueryParameters: (constraints?: WebQueryParametersConstraints): Arbitrary<string>;
export declare const webSegment: (constraints?: WebSegmentConstraints): Arbitrary<string>;
export declare const webUrl: (constraints?: WebUrlConstraints): Arbitrary<string>;
```

## Other Exports (Non-Function)

- `__commitHash` (variable)
- `__type` (variable)
- `__version` (variable)
- `Arbitrary` (class)
- `ArrayConstraints` (interface)
- `AsyncCommand` (interface)
- `AsyncPropertyHookFunction` (type)
- `asyncToStringMethod` (variable)
- `BigIntArrayConstraints` (type)
- `BigIntConstraints` (interface)
- `cloneMethod` (variable)
- `CloneValue` (type)
- `Command` (interface)
- `CommandsContraints` (interface)
- `ContextValue` (interface)
- `DateConstraints` (interface)
- `DepthContext` (type)
- `DepthIdentifier` (type)
- `DepthSize` (type)
- `DictionaryConstraints` (interface)
- `DomainConstraints` (interface)
- `DoubleConstraints` (interface)
- `EmailAddressConstraints` (interface)
- `EntityGraphArbitraries` (type)
- `EntityGraphContraints` (type)
- `EntityGraphRelations` (type)
- `EntityGraphValue` (type)
- `ExecutionStatus` (enum)
- `ExecutionTree` (interface)
- `FalsyContraints` (interface)
- `FalsyValue` (type)
- `Float32ArrayConstraints` (type)
- `Float64ArrayConstraints` (type)
- `FloatConstraints` (interface)
- `GeneratorValue` (type)
- `GlobalAsyncPropertyHookFunction` (type)
- `GlobalParameters` (type)
- `GlobalPropertyHookFunction` (type)
- `IAsyncProperty` (interface)
- `IAsyncPropertyWithHooks` (interface)
- `ICommand` (interface)
- `IntArrayConstraints` (type)
- `IntegerConstraints` (interface)
- `IProperty` (interface)
- `IPropertyWithHooks` (interface)
- `IRawProperty` (interface)
- `JsonSharedConstraints` (interface)
- `JsonValue` (type)
- `LetrecLooselyTypedBuilder` (type)
- `LetrecLooselyTypedTie` (type)
- `LetrecTypedBuilder` (type)
- `LetrecTypedTie` (interface)
- `LetrecValue` (type)
- `LoremConstraints` (interface)
- `MapConstraints` (interface)
- `MaybeWeightedArbitrary` (type)
- `Memo` (type)
- `MixedCaseConstraints` (interface)
- `ModelRunAsyncSetup` (type)
- `ModelRunSetup` (type)
- `NatConstraints` (interface)
- `ObjectConstraints` (interface)
- `OneOfConstraints` (type)
- `OneOfValue` (type)
- `OptionConstraints` (interface)
- `Parameters` (interface)
- `PreconditionFailure` (class)
- `PropertyFailure` (type)
- `PropertyHookFunction` (type)
- `Random` (class)
- `RandomType` (type)
- `RecordConstraints` (type)
- `RecordValue` (type)
- `RunDetails` (type)
- `RunDetailsCommon` (interface)
- `RunDetailsFailureInterrupted` (interface)
- `RunDetailsFailureProperty` (interface)
- `RunDetailsFailureTooManySkips` (interface)
- `RunDetailsSuccess` (interface)
- `Scheduler` (interface)
- `SchedulerAct` (type)
- `SchedulerConstraints` (interface)
- `SchedulerReportItem` (interface)
- `SchedulerSequenceItem` (type)
- `SetConstraints` (type)
- `ShuffledSubarrayConstraints` (interface)
- `Size` (type)
- `SizeForArbitrary` (type)
- `SparseArrayConstraints` (interface)
- `Stream` (class)
- `StringConstraints` (type)
- `StringMatchingConstraints` (type)
- `StringSharedConstraints` (interface)
- `SubarrayConstraints` (interface)
- `toStringMethod` (variable)
- `UniqueArrayConstraints` (type)
- `UniqueArrayConstraintsCustomCompare` (type)
- `UniqueArrayConstraintsCustomCompareSelect` (type)
- `UniqueArrayConstraintsRecommended` (type)
- `UniqueArraySharedConstraints` (type)
- `UuidConstraints` (interface)
- `Value` (class)
- `VerbosityLevel` (enum)
- `WebAuthorityConstraints` (interface)
- `WebFragmentsConstraints` (interface)
- `WebPathConstraints` (interface)
- `WebQueryParametersConstraints` (interface)
- `WebSegmentConstraints` (interface)
- `WebUrlConstraints` (interface)
- `WeightedArbitrary` (interface)
- `WithAsyncToStringMethod` (type)
- `WithCloneMethod` (interface)
- `WithToStringMethod` (type)
