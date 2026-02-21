# API Reference: effect/Filter

- Import path: `effect/Filter`
- Source file: `packages/effect/src/Filter.ts`
- Function exports (callable): 29
- Non-function exports: 7

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `andLeft`
- `andRight`
- `apply`
- `bigint`
- `boolean`
- `compose`
- `composePassthrough`
- `date`
- `equals`
- `equalsStrict`
- `fromPredicate`
- `fromPredicateOption`
- `has`
- `instanceOf`
- `make`
- `makeEffect`
- `mapFail`
- `number`

## All Function Signatures

```ts
export declare const andLeft: <InputR, PassR, FailR>(right: Filter<InputR, PassR, FailR>): <InputL, PassL, FailL>(left: Filter<InputL, PassL, FailL>) => Filter<InputL & InputR, PassL, FailL | FailR>; // overload 1
export declare const andLeft: <InputL, PassL, FailL, InputR, PassR, FailR>(left: Filter<InputL, PassL, FailL>, right: Filter<InputR, PassR, FailR>): Filter<InputL & InputR, PassL, FailL | FailR>; // overload 2
export declare const andRight: <InputR, PassR, FailR>(right: Filter<InputR, PassR, FailR>): <InputL, PassL, FailL>(left: Filter<InputL, PassL, FailL>) => Filter<InputL & InputR, PassR, FailL | FailR>; // overload 1
export declare const andRight: <InputL, PassL, FailL, InputR, PassR, FailR>(left: Filter<InputL, PassL, FailL>, right: Filter<InputR, PassR, FailR>): Filter<InputL & InputR, PassR, FailL | FailR>; // overload 2
export declare const apply: <In, R extends ResultOrBool>(filter: (input: In, ...args: Array<any>) => R, input: In, ...args: Array<any>): ApplyResult<In, R>;
export declare const bigint: (input: unknown): Result.Result<bigint, unknown>;
export declare const boolean: (input: unknown): Result.Result<boolean, unknown>;
export declare const compose: <PassL, PassR, FailR>(right: Filter<PassL, PassR, FailR>): <InputL, FailL>(left: Filter<InputL, PassL, FailL>) => Filter<InputL, PassR, FailL | FailR>; // overload 1
export declare const compose: <InputL, PassL, FailL, PassR, FailR>(left: Filter<InputL, PassL, FailL>, right: Filter<PassL, PassR, FailR>): Filter<InputL, PassR, FailL | FailR>; // overload 2
export declare const composePassthrough: <InputL, PassL, PassR, FailR>(right: Filter<PassL, PassR, FailR>): <FailL>(left: Filter<InputL, PassL, FailL>) => Filter<InputL, PassR, InputL>; // overload 1
export declare const composePassthrough: <InputL, PassL, FailL, PassR, FailR>(left: Filter<InputL, PassL, FailL>, right: Filter<PassL, PassR, FailR>): Filter<InputL, PassR, InputL>; // overload 2
export declare const date: (input: unknown): Result.Result<Date, unknown>;
export declare const equals: <const A, Input = unknown>(value: A): Filter<Input, A, EqualsWith<Input, A, A, Exclude<Input, A>>>;
export declare const equalsStrict: <const A, Input = unknown>(value: A): Filter<Input, A, EqualsWith<Input, A, A, Exclude<Input, A>>>;
export declare const fromPredicate: <A, B extends A>(refinement: Predicate.Refinement<A, B>): Filter<A, B, EqualsWith<A, B, A, Exclude<A, B>>>; // overload 1
export declare const fromPredicate: <A>(predicate: Predicate.Predicate<A>): Filter<A>; // overload 2
export declare const fromPredicateOption: <A, B>(predicate: (a: A) => Option.Option<B>): Filter<A, B>;
export declare const has: <K>(key: K): <Input extends { readonly has: (key: K) => boolean; }>(input: Input) => Result.Result<Input, Input>;
export declare const instanceOf: <K extends new (...args: any) => any>(constructor: K): <Input>(u: Input) => Result.Result<InstanceType<K>, Exclude<Input, InstanceType<K>>>;
export declare const make: <Input, Pass, Fail>(f: (input: Input) => Result.Result<Pass, Fail>): Filter<Input, Pass, Fail>;
export declare const makeEffect: <Input, Pass, Fail, E, R>(f: (input: Input) => Effect<Result.Result<Pass, Fail>, E, R>): FilterEffect<Input, Pass, Fail, E, R>;
export declare const mapFail: <Fail, Fail2>(f: (fail: Fail) => Fail2): <Input, Pass>(self: Filter<Input, Pass, Fail>) => Filter<Input, Pass, Fail2>; // overload 1
export declare const mapFail: <Input, Pass, Fail, Fail2>(self: Filter<Input, Pass, Fail>, f: (fail: Fail) => Fail2): Filter<Input, Pass, Fail2>; // overload 2
export declare const number: (input: unknown): Result.Result<number, unknown>;
export declare const or: <Input2, Pass2, Fail2>(that: Filter<Input2, Pass2, Fail2>): <Input1, Pass2, Fail2>(self: Filter<Input1, Pass2>) => Filter<Input1 & Input2, Pass2 | Pass2, Fail2>; // overload 1
export declare const or: <Input1, Pass1, Fail1, Input2, Pass2, Fail2>(self: Filter<Input1, Pass1, Fail1>, that: Filter<Input2, Pass2, Fail2>): Filter<Input1 & Input2, Pass1 | Pass2, Fail2>; // overload 2
export declare const reason: <Input>(): <const Tag extends Tags<Input>, const ReasonTag extends ReasonTags<ExtractTag<Input, Tag>>>(tag: Tag, reasonTag: ReasonTag) => Filter<Input, ExtractReason<ExtractTag<Input, Tag>, ReasonTag>, Input>; // overload 1
export declare const reason: <Input, const Tag extends Tags<Input>, const ReasonTag extends ReasonTags<ExtractTag<Input, Tag>>>(tag: Tag, reasonTag: ReasonTag): Filter<Input, ExtractReason<ExtractTag<Input, Tag>, ReasonTag>, Input>; // overload 2
export declare const reason: <const Tag extends string, const ReasonTag extends string>(tag: Tag, reasonTag: ReasonTag): <Input>(input: Input) => Result.Result<ExtractReason<ExtractTag<Input, Tag>, ReasonTag>, Input>; // overload 3
export declare const string: (input: unknown): Result.Result<string, unknown>;
export declare const symbol: (input: unknown): Result.Result<symbol, unknown>;
export declare const tagged: <Input>(): <const Tag extends Tags<Input>>(tag: Tag) => Filter<Input, ExtractTag<Input, Tag>, ExcludeTag<Input, Tag>>; // overload 1
export declare const tagged: <Input, const Tag extends Tags<Input>>(tag: Tag): Filter<Input, ExtractTag<Input, Tag>, ExcludeTag<Input, Tag>>; // overload 2
export declare const tagged: <const Tag extends string>(tag: Tag): <Input>(input: Input) => Result.Result<ExtractTag<Input, Tag>, ExcludeTag<Input, Tag>>; // overload 3
export declare const toOption: <A, Pass, Fail>(self: Filter<A, Pass, Fail>): (input: A) => Option.Option<Pass>;
export declare const toPredicate: <A, Pass, Fail>(self: Filter<A, Pass, Fail>): Predicate.Predicate<A>;
export declare const toResult: <A, Pass, Fail>(self: Filter<A, Pass, Fail>): (input: A) => Result.Result<Pass, Fail>;
export declare const try: <Input, Output>(f: (input: Input) => Output): Filter<Input, Output>;
export declare const zip: <InputR, PassR, FailR>(right: Filter<InputR, PassR, FailR>): <InputL, PassL, FailL>(left: Filter<InputL, PassL, FailL>) => Filter<InputL & InputR, [PassL, PassR], FailL | FailR>; // overload 1
export declare const zip: <InputL, PassL, FailL, InputR, PassR, FailR>(left: Filter<InputL, PassL, FailL>, right: Filter<InputR, PassR, FailR>): Filter<InputL & InputR, [PassL, PassR], FailL | FailR>; // overload 2
export declare const zipWith: <PassL, InputR, PassR, FailR, A>(right: Filter<InputR, PassR, FailR>, f: (left: PassL, right: PassR) => A): <InputL, FailL>(left: Filter<InputL, PassL, FailL>) => Filter<InputL & InputR, A, FailL | FailR>; // overload 1
export declare const zipWith: <InputL, PassL, FailL, InputR, PassR, FailR, A>(left: Filter<InputL, PassL, FailL>, right: Filter<InputR, PassR, FailR>, f: (left: PassL, right: PassR) => A): Filter<InputL & InputR, A, FailL | FailR>; // overload 2
```

## Other Exports (Non-Function)

- `ApplyResult` (type)
- `Fail` (type)
- `Filter` (interface)
- `FilterEffect` (interface)
- `OrPredicate` (type)
- `Pass` (type)
- `ResultOrBool` (type)
