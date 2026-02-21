# API Reference: effect/Match#predicates

- Import path: `effect/Match#predicates`
- Source file: `packages/effect/src/Match.ts`
- Thematic facet: `predicates`
- Function exports (callable): 35
- Non-function exports: 10

## Purpose

The `effect/match` module provides a type-safe pattern matching system for TypeScript. Inspired by functional programming, it simplifies conditional logic by replacing verbose if/else or switch statements with a structured and expressive API.

## Key Function Exports

- `bigint`
- `boolean`
- `date`
- `defined`
- `discriminator`
- `discriminators`
- `discriminatorsExhaustive`
- `discriminatorStartsWith`
- `exhaustive`
- `instanceOf`
- `instanceOfUnsafe`
- `is`
- `not`
- `null`
- `number`
- `option`
- `orElse`
- `orElseAbsurd`

## All Function Signatures

```ts
export declare const bigint: (a: unknown): a is bigint;
export declare const boolean: (a: unknown): a is boolean;
export declare const date: (a: unknown): a is Date;
export declare const defined: <A>(u: A): u is A & {};
export declare const discriminator: <D extends string>(field: D): <R, P extends Types.Tags<D, R> & string, Ret, Fn extends (_: Extract<R, Record<D, P>>) => Ret>(...pattern: [first: P, ...values: Array<P>, f: Fn]) => <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddWithout<F, Extract<R, Record<D, P>>>, Types.ApplyFilters<I, Types.AddWithout<F, Extract<R, Record<D, P>>>>, A | ReturnType<Fn>, Pr, Ret>;
export declare const discriminators: <D extends string>(field: D): <R, Ret, P extends { readonly [Tag in Types.Tags<D, R> & string]?: ((_: Extract<R, Record<D, Tag>>) => Ret) | undefined; } & { readonly [Tag in Exclude<keyof P, Types.Tags<D, R>>]: never; }>(fields: P) => <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddWithout<F, Extract<R, Record<D, keyof P>>>, Types.ApplyFilters<I, Types.AddWithout<F, Extract<R, Record<D, keyof P>>>>, A | ReturnType<P[keyof P] & {}>, Pr, Ret>;
export declare const discriminatorsExhaustive: <D extends string>(field: D): <R, Ret, P extends { readonly [Tag in Types.Tags<D, R> & string]: (_: Extract<R, Record<D, Tag>>) => Ret; } & { readonly [Tag in Exclude<keyof P, Types.Tags<D, R>>]: never; }>(fields: P) => <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => [Pr] extends [never] ? (u: I) => Unify<A | ReturnType<P[keyof P]>> : Unify<A | ReturnType<P[keyof P]>>;
export declare const discriminatorStartsWith: <D extends string>(field: D): <R, P extends string, Ret, Fn extends (_: Extract<R, Record<D, `${P}${string}`>>) => Ret>(pattern: P, f: Fn) => <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddWithout<F, Extract<R, Record<D, `${P}${string}`>>>, Types.ApplyFilters<I, Types.AddWithout<F, Extract<R, Record<D, `${P}${string}`>>>>, A | ReturnType<Fn>, Pr, Ret>;
export declare const exhaustive: <I, F, A, Pr, Ret>(self: Matcher<I, F, never, A, Pr, Ret>): [Pr] extends [never] ? (u: I) => Unify<A> : Unify<A>;
export declare const instanceOf: <A extends abstract new (...args: any) => any>(constructor: A): SafeRefinement<InstanceType<A>, never>;
export declare const instanceOfUnsafe: <A extends abstract new (...args: any) => any>(constructor: A): SafeRefinement<InstanceType<A>, InstanceType<A>>;
export declare const is: <Literals extends ReadonlyArray<string | number | bigint | boolean | null>>(...literals: Literals): SafeRefinement<Literals[number]>;
export declare const not: <R, const P extends Types.PatternPrimitive<R> | Types.PatternBase<R>, Ret, Fn extends (_: Types.NotMatch<R, P>) => Ret>(pattern: P, f: Fn): <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddOnly<F, Types.WhenMatch<R, P>>, Types.ApplyFilters<I, Types.AddOnly<F, Types.WhenMatch<R, P>>>, A | ReturnType<Fn>, Pr, Ret>;
export declare const null: (a: unknown): a is null;
export declare const number: (a: unknown): a is number;
export declare const option: <I, F, R, A, Pr, Ret>(self: Matcher<I, F, R, A, Pr, Ret>): [Pr] extends [never] ? (input: I) => Option.Option<Unify<A>> : Option.Option<Unify<A>>;
export declare const orElse: <RA, Ret, F extends (_: RA) => Ret>(f: F): <I, R, A, Pr>(self: Matcher<I, R, RA, A, Pr, Ret>) => [Pr] extends [never] ? (input: I) => Unify<ReturnType<F> | A> : Unify<ReturnType<F> | A>;
export declare const orElseAbsurd: <I, R, RA, A, Pr, Ret>(self: Matcher<I, R, RA, A, Pr, Ret>): [Pr] extends [never] ? (input: I) => Unify<A> : Unify<A>;
export declare const record: (a: unknown): a is { [x: string]: unknown; [x: number]: unknown; [x: symbol]: unknown; };
export declare const result: <I, F, R, A, Pr, Ret>(self: Matcher<I, F, R, A, Pr, Ret>): [Pr] extends [never] ? (input: I) => Result.Result<Unify<A>, R> : Result.Result<Unify<A>, R>;
export declare const string: (a: unknown): a is string;
export declare const symbol: (a: unknown): a is symbol;
export declare const tag: <R, P extends Types.Tags<"_tag", R> & string, Ret, Fn extends (_: Extract<R, Record<"_tag", P>>) => Ret>(...pattern: [first: P, ...values: Array<P>, f: Fn]): <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddWithout<F, Extract<R, Record<"_tag", P>>>, Types.ApplyFilters<I, Types.AddWithout<F, Extract<R, Record<"_tag", P>>>>, ReturnType<Fn> | A, Pr, Ret>;
export declare const tags: <R, Ret, P extends { readonly [Tag in Types.Tags<"_tag", R> & string]?: ((_: Extract<R, Record<"_tag", Tag>>) => Ret) | undefined; } & { readonly [Tag in Exclude<keyof P, Types.Tags<"_tag", R>>]: never; }>(fields: P): <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddWithout<F, Extract<R, Record<"_tag", keyof P>>>, Types.ApplyFilters<I, Types.AddWithout<F, Extract<R, Record<"_tag", keyof P>>>>, A | ReturnType<P[keyof P] & {}>, Pr, Ret>;
export declare const tagsExhaustive: <R, Ret, P extends { readonly [Tag in Types.Tags<"_tag", R> & string]: (_: Extract<R, Record<"_tag", Tag>>) => Ret; } & { readonly [Tag in Exclude<keyof P, Types.Tags<"_tag", R>>]: never; }>(fields: P): <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => [Pr] extends [never] ? (u: I) => Unify<A | ReturnType<P[keyof P]>> : Unify<A | ReturnType<P[keyof P]>>;
export declare const tagStartsWith: <R, P extends string, Ret, Fn extends (_: Extract<R, Record<"_tag", `${P}${string}`>>) => Ret>(pattern: P, f: Fn): <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddWithout<F, Extract<R, Record<"_tag", `${P}${string}`>>>, Types.ApplyFilters<I, Types.AddWithout<F, Extract<R, Record<"_tag", `${P}${string}`>>>>, ReturnType<Fn> | A, Pr, Ret>;
export declare const type: <I>(): Matcher<I, Types.Without<never>, I, never, never>;
export declare const typeTags: <I, Ret>(): <P extends { readonly [Tag in Types.Tags<"_tag", I> & string]: (_: Extract<I, { readonly _tag: Tag; }>) => Ret; } & { readonly [Tag in Exclude<keyof P, Types.Tags<"_tag", I>>]: never; }>(fields: P) => (input: I) => Ret; // overload 1
export declare const typeTags: <I>(): <P extends { readonly [Tag in Types.Tags<"_tag", I> & string]: (_: Extract<I, { readonly _tag: Tag; }>) => any; } & { readonly [Tag in Exclude<keyof P, Types.Tags<"_tag", I>>]: never; }>(fields: P) => (input: I) => Unify<ReturnType<P[keyof P]>>; // overload 2
export declare const undefined: (a: unknown): a is undefined;
export declare const value: <const I>(i: I): Matcher<I, Types.Without<never>, I, never, I>;
export declare const valueTags: <const I, P extends { readonly [Tag in Types.Tags<"_tag", I> & string]: (_: Extract<I, { readonly _tag: Tag; }>) => any; } & { readonly [Tag in Exclude<keyof P, Types.Tags<"_tag", I>>]: never; }>(fields: P): (input: I) => Unify<ReturnType<P[keyof P]>>; // overload 1
export declare const valueTags: <const I, P extends { readonly [Tag in Types.Tags<"_tag", I> & string]: (_: Extract<I, { readonly _tag: Tag; }>) => any; } & { readonly [Tag in Exclude<keyof P, Types.Tags<"_tag", I>>]: never; }>(input: I, fields: P): Unify<ReturnType<P[keyof P]>>; // overload 2
export declare const when: <R, const P extends Types.PatternPrimitive<R> | Types.PatternBase<R>, Ret, Fn extends (_: Types.WhenMatch<R, P>) => Ret>(pattern: P, f: Fn): <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddWithout<F, Types.PForExclude<P>>, Types.ApplyFilters<I, Types.AddWithout<F, Types.PForExclude<P>>>, A | ReturnType<Fn>, Pr, Ret>;
export declare const whenAnd: <R, const P extends ReadonlyArray<Types.PatternPrimitive<R> | Types.PatternBase<R>>, Ret, Fn extends (_: Types.WhenMatch<R, T.UnionToIntersection<P[number]>>) => Ret>(...args: [...patterns: P, f: Fn]): <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddWithout<F, Types.PForExclude<T.UnionToIntersection<P[number]>>>, Types.ApplyFilters<I, Types.AddWithout<F, Types.PForExclude<T.UnionToIntersection<P[number]>>>>, A | ReturnType<Fn>, Pr>;
export declare const whenOr: <R, const P extends ReadonlyArray<Types.PatternPrimitive<R> | Types.PatternBase<R>>, Ret, Fn extends (_: Types.WhenMatch<R, P[number]>) => Ret>(...args: [...patterns: P, f: Fn]): <I, F, A, Pr>(self: Matcher<I, F, R, A, Pr, Ret>) => Matcher<I, Types.AddWithout<F, Types.PForExclude<P[number]>>, Types.ApplyFilters<I, Types.AddWithout<F, Types.PForExclude<P[number]>>>, A | ReturnType<Fn>, Pr, Ret>;
export declare const withReturnType: <Ret>(): <I, F, R, A, Pr, _>(self: Matcher<I, F, R, A, Pr, _>) => [Ret] extends [[A] extends [never] ? any : A] ? Matcher<I, F, R, A, Pr, Ret> : "withReturnType constraint does not extend Result type";
```

## Other Exports (Non-Function)

- `any` (variable)
- `Case` (type)
- `Matcher` (type)
- `nonEmptyString` (variable)
- `Not` (interface)
- `SafeRefinement` (interface)
- `TypeMatcher` (interface)
- `Types` (namespace)
- `ValueMatcher` (interface)
- `When` (interface)
