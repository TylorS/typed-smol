# API Reference: effect/Effect#error-handling

- Import path: `effect/Effect#error-handling`
- Source file: `packages/effect/src/Effect.ts`
- Thematic facet: `error-handling`
- Function exports (callable): 43
- Non-function exports: 3

## Purpose

The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## Key Function Exports

- `catch`
- `catchCause`
- `catchCauseIf`
- `catchDefect`
- `catchEager`
- `catchIf`
- `catchNoSuchElement`
- `catchReason`
- `catchReasons`
- `catchTag`
- `catchTags`
- `fail`
- `failCause`
- `failCauseSync`
- `failSync`
- `filterOrElse`
- `filterOrFail`
- `ignoreCause`

## All Function Signatures

```ts
export declare const catch: <E, A2, E2, R2>(f: (e: E) => Effect<A2, E2, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A2 | A, E2, R2 | R>; // overload 1
export declare const catch: <A, E, R, A2, E2, R2>(self: Effect<A, E, R>, f: (e: E) => Effect<A2, E2, R2>): Effect<A2 | A, E2, R2 | R>; // overload 2
export declare const catchCause: <E, A2, E2, R2>(f: (cause: Cause.Cause<E>) => Effect<A2, E2, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A2 | A, E2, R2 | R>; // overload 1
export declare const catchCause: <A, E, R, A2, E2, R2>(self: Effect<A, E, R>, f: (cause: Cause.Cause<E>) => Effect<A2, E2, R2>): Effect<A | A2, E2, R | R2>; // overload 2
export declare const catchCauseIf: <E, Result extends Filter.ResultOrBool<Cause.Cause<any>>, B, E2, R2>(filter: Filter.OrPredicate<Cause.Cause<E>, Result>, f: (failure: Filter.Pass<Cause.Cause<E>, Result>, cause: Cause.Cause<E>) => Effect<B, E2, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A | B, Cause.Cause.Error<Filter.Fail<Cause.Cause<E>, Result>> | E2, R | R2>; // overload 1
export declare const catchCauseIf: <A, E, R, B, E2, R2, Result extends Filter.ResultOrBool<Cause.Cause<any>>>(self: Effect<A, E, R>, filter: Filter.OrPredicate<Cause.Cause<E>, Result>, f: (failure: Filter.Pass<Cause.Cause<E>, Result>, cause: Cause.Cause<E>) => Effect<B, E2, R2>): Effect<A | B, Cause.Cause.Error<Filter.Fail<Cause.Cause<E>, Result>> | E2, R | R2>; // overload 2
export declare const catchDefect: <A2, E2, R2>(f: (defect: unknown) => Effect<A2, E2, R2>): <A, E, R>(self: Effect<A, E, R>) => Effect<A2 | A, E2 | E, R2 | R>; // overload 1
export declare const catchDefect: <A, E, R, A2, E2, R2>(self: Effect<A, E, R>, f: (defect: unknown) => Effect<A2, E2, R2>): Effect<A | A2, E | E2, R | R2>; // overload 2
export declare const catchEager: <E, B, E2, R2>(f: (e: NoInfer<E>) => Effect<B, E2, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A | B, E2, R | R2>; // overload 1
export declare const catchEager: <A, E, R, B, E2, R2>(self: Effect<A, E, R>, f: (e: NoInfer<E>) => Effect<B, E2, R2>): Effect<A | B, E2, R | R2>; // overload 2
export declare const catchIf: <E, EB extends E, A2, E2, R2, A3 = never, E3 = Exclude<E, EB>, R3 = never>(refinement: Predicate.Refinement<NoInfer<E>, EB>, f: (e: EB) => Effect<A2, E2, R2>, orElse?: ((e: Exclude<E, EB>) => Effect<A3, E3, R3>) | undefined): <A, R>(self: Effect<A, E, R>) => Effect<A | A2 | A3, E2 | E3, R | R2 | R3>; // overload 1
export declare const catchIf: <E, Result extends Filter.ResultOrBool, A2, E2, R2, A3 = never, E3 = Filter.Fail<E, Result>, R3 = never>(filter: Filter.OrPredicate<NoInfer<E>, Result>, f: (e: Filter.Pass<E, Result>) => Effect<A2, E2, R2>, orElse?: ((e: Filter.Fail<E, Result>) => Effect<A3, E3, R3>) | undefined): <A, R>(self: Effect<A, E, R>) => Effect<A | A2 | A3, E2 | E3, R | R2 | R3>; // overload 2
export declare const catchIf: <A, E, R, EB extends E, A2, E2, R2, A3 = never, E3 = Exclude<E, EB>, R3 = never>(self: Effect<A, E, R>, refinement: Predicate.Refinement<E, EB>, f: (e: EB) => Effect<A2, E2, R2>, orElse?: ((e: Exclude<E, EB>) => Effect<A3, E3, R3>) | undefined): Effect<A | A2 | A3, E2 | E3, R | R2 | R3>; // overload 3
export declare const catchIf: <A, E, R, Result extends Filter.ResultOrBool, A2, E2, R2, A3 = never, E3 = Filter.Fail<E, Result>, R3 = never>(self: Effect<A, E, R>, filter: Filter.OrPredicate<NoInfer<E>, Result>, f: (e: Filter.Pass<E, Result>) => Effect<A2, E2, R2>, orElse?: ((e: Filter.Fail<E, Result>) => Effect<A3, E3, R3>) | undefined): Effect<A | A2 | A3, E2 | E3, R | R2 | R3>; // overload 4
export declare const catchNoSuchElement: <A, E, R>(self: Effect<A, E, R>): Effect<Option<A>, Exclude<E, Cause.NoSuchElementError>, R>;
export declare const catchReason: <K extends Tags<E>, E, RK extends ReasonTags<ExtractTag<NoInfer<E>, K>>, A2, E2, R2, A3 = unassigned, E3 = never, R3 = never>(errorTag: K, reasonTag: RK, f: (reason: ExtractReason<ExtractTag<NoInfer<E>, K>, RK>) => Effect<A2, E2, R2>, orElse?: ((reasons: ExcludeReason<ExtractTag<NoInfer<E>, K>, RK>) => Effect<A3, E3, R3>) | undefined): <A, R>(self: Effect<A, E, R>) => Effect<A | A2 | Exclude<A3, unassigned>, (A3 extends unassigned ? E : ExcludeTag<E, K>) | E2 | E3, R | R2 | R3>; // overload 1
export declare const catchReason: <A, E, R, K extends Tags<E>, RK extends ReasonTags<ExtractTag<E, K>>, A2, E2, R2, A3 = unassigned, E3 = never, R3 = never>(self: Effect<A, E, R>, errorTag: K, reasonTag: RK, f: (reason: ExtractReason<ExtractTag<E, K>, RK>) => Effect<A2, E2, R2>, orElse?: ((reasons: ExcludeReason<ExtractTag<E, K>, RK>) => Effect<A3, E3, R3>) | undefined): Effect<A | A2 | Exclude<A3, unassigned>, (A3 extends unassigned ? E : ExcludeTag<E, K>) | E2 | E3, R | R2 | R3>; // overload 2
export declare const catchReasons: <K extends Tags<E>, E, Cases extends { [RK in ReasonTags<ExtractTag<NoInfer<E>, K>>]+?: (reason: ExtractReason<ExtractTag<NoInfer<E>, K>, RK>) => Effect<any, any, any>; }, A2 = unassigned, E2 = never, R2 = never>(errorTag: K, cases: Cases, orElse?: ((reason: ExcludeReason<ExtractTag<NoInfer<E>, K>, Extract<keyof Cases, string>>) => Effect<A2, E2, R2>) | undefined): <A, R>(self: Effect<A, E, R>) => Effect<A | Exclude<A2, unassigned> | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Effect<infer A, any, any> ? A : never; }[keyof Cases], (A2 extends unassigned ? E : ExcludeTag<E, K>) | E2 | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Effect<any, infer E, any> ? E : never; }[keyof Cases], R | R2 | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Effect<any, any, infer R> ? R : never; }[keyof Cases]>; // overload 1
export declare const catchReasons: <A, E, R, K extends Tags<E>, Cases extends { [RK in ReasonTags<ExtractTag<E, K>>]+?: (reason: ExtractReason<ExtractTag<E, K>, RK>) => Effect<any, any, any>; }, A2 = unassigned, E2 = never, R2 = never>(self: Effect<A, E, R>, errorTag: K, cases: Cases, orElse?: ((reason: ExcludeReason<ExtractTag<NoInfer<E>, K>, Extract<keyof Cases, string>>) => Effect<A2, E2, R2>) | undefined): Effect<A | Exclude<A2, unassigned> | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Effect<infer A, any, any> ? A : never; }[keyof Cases], (A2 extends unassigned ? E : ExcludeTag<E, K>) | E2 | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Effect<any, infer E, any> ? E : never; }[keyof Cases], R | R2 | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Effect<any, any, infer R> ? R : never; }[keyof Cases]>; // overload 2
export declare const catchTag: <const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, E, A1, E1, R1, A2 = never, E2 = ExcludeTag<E, K extends readonly [string, ...string[]] ? K[number] : K>, R2 = never>(k: K, f: (e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Effect<A1, E1, R1>, orElse?: ((e: ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Effect<A2, E2, R2>) | undefined): <A, R>(self: Effect<A, E, R>) => Effect<A | A1 | A2, E1 | E2, R | R1 | R2>; // overload 1
export declare const catchTag: <A, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, R1, E1, A1, A2 = never, E2 = ExcludeTag<E, K extends readonly [string, ...string[]] ? K[number] : K>, R2 = never>(self: Effect<A, E, R>, k: K, f: (e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Effect<A1, E1, R1>, orElse?: ((e: ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Effect<A2, E2, R2>) | undefined): Effect<A | A1 | A2, E1 | E2, R | R1 | R2>; // overload 2
export declare const catchTags: <E, Cases extends { [K in Extract<E, { _tag: string; }>["_tag"]]+?: ((error: Extract<E, { _tag: K; }>) => Effect<any, any, any>); } & (unknown extends E ? {} : { [K in Exclude<keyof Cases, Extract<E, { _tag: string; }>["_tag"]>]: never; })>(cases: Cases): <A, R>(self: Effect<A, E, R>) => Effect<A | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect<infer A, any, any> ? A : never; }[keyof Cases], Exclude<E, { _tag: keyof Cases; }> | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect<any, infer E, any> ? E : never; }[keyof Cases], R | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect<any, any, infer R> ? R : never; }[keyof Cases]>; // overload 1
export declare const catchTags: <R, E, A, Cases extends { [K in Extract<E, { _tag: string; }>["_tag"]]+?: ((error: Extract<E, { _tag: K; }>) => Effect<any, any, any>); } & (unknown extends E ? {} : { [K in Exclude<keyof Cases, Extract<E, { _tag: string; }>["_tag"]>]: never; })>(self: Effect<A, E, R>, cases: Cases): Effect<A | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect<infer A, any, any> ? A : never; }[keyof Cases], Exclude<E, { _tag: keyof Cases; }> | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect<any, infer E, any> ? E : never; }[keyof Cases], R | { [K in keyof Cases]: Cases[K] extends (...args: Array<any>) => Effect<any, any, infer R> ? R : never; }[keyof Cases]>; // overload 2
export declare const fail: <E>(error: E): Effect<never, E>;
export declare const failCause: <E>(cause: Cause.Cause<E>): Effect<never, E>;
export declare const failCauseSync: <E>(evaluate: LazyArg<Cause.Cause<E>>): Effect<never, E>;
export declare const failSync: <E>(evaluate: LazyArg<E>): Effect<never, E>;
export declare const filterOrElse: <A, C, E2, R2, B extends A>(refinement: Predicate.Refinement<NoInfer<A>, B>, orElse: (a: EqualsWith<A, B, NoInfer<A>, Exclude<NoInfer<A>, B>>) => Effect<C, E2, R2>): <E, R>(self: Effect<A, E, R>) => Effect<B | C, E2 | E, R2 | R>; // overload 1
export declare const filterOrElse: <A, Result extends Filter.ResultOrBool, C, E2, R2>(filter: Filter.OrPredicate<NoInfer<A>, Result>, orElse: (a: Filter.Fail<A, Result>) => Effect<C, E2, R2>): <E, R>(self: Effect<A, E, R>) => Effect<Filter.Pass<A, Result> | C, E2 | E, R2 | R>; // overload 2
export declare const filterOrElse: <A, E, R, C, E2, R2, B extends A>(self: Effect<A, E, R>, refinement: Predicate.Refinement<A, B>, orElse: (a: EqualsWith<A, B, A, Exclude<A, B>>) => Effect<C, E2, R2>): Effect<B | C, E | E2, R | R2>; // overload 3
export declare const filterOrElse: <A, E, R, Result extends Filter.ResultOrBool, C, E2, R2>(self: Effect<A, E, R>, filter: Filter.OrPredicate<NoInfer<A>, Result>, orElse: (a: Filter.Fail<A, Result>) => Effect<C, E2, R2>): Effect<Filter.Pass<A, Result> | C, E | E2, R | R2>; // overload 4
export declare const filterOrFail: <A, E2, B extends A>(refinement: Predicate.Refinement<NoInfer<A>, B>, orFailWith: (a: NoInfer<A>) => E2): <E, R>(self: Effect<A, E, R>) => Effect<B, E2 | E, R>; // overload 1
export declare const filterOrFail: <A, E2>(predicate: Predicate.Predicate<NoInfer<A>>, orFailWith: (a: NoInfer<A>) => E2): <E, R>(self: Effect<A, E, R>) => Effect<A, E2 | E, R>; // overload 2
export declare const filterOrFail: <A, B, X, E2>(filter: Filter.Filter<NoInfer<A>, B, X>, orFailWith: (x: X) => E2): <E, R>(self: Effect<A, E, R>) => Effect<B, E2 | E, R>; // overload 3
export declare const filterOrFail: <A, B extends A>(refinement: Predicate.Refinement<NoInfer<A>, B>): <E, R>(self: Effect<A, E, R>) => Effect<B, Cause.NoSuchElementError | E, R>; // overload 4
export declare const filterOrFail: <A>(predicate: Predicate.Predicate<NoInfer<A>>): <E, R>(self: Effect<A, E, R>) => Effect<A, Cause.NoSuchElementError | E, R>; // overload 5
export declare const filterOrFail: <A, B, X>(filter: Filter.Filter<NoInfer<A>, B, X>): <E, R>(self: Effect<A, E, R>) => Effect<B, Cause.NoSuchElementError | E, R>; // overload 6
export declare const filterOrFail: <A, E, R, E2, B extends A>(self: Effect<A, E, R>, refinement: Predicate.Refinement<NoInfer<A>, B>, orFailWith: (a: NoInfer<A>) => E2): Effect<B, E2 | E, R>; // overload 7
export declare const filterOrFail: <A, E, R, E2>(self: Effect<A, E, R>, predicate: Predicate.Predicate<NoInfer<A>>, orFailWith: (a: NoInfer<A>) => E2): Effect<A, E2 | E, R>; // overload 8
export declare const filterOrFail: <A, E, R, B, X, E2>(self: Effect<A, E, R>, filter: Filter.Filter<A, B, X>, orFailWith: (x: X) => E2): Effect<B, E2 | E, R>; // overload 9
export declare const filterOrFail: <A, E, R, B extends A>(self: Effect<A, E, R>, refinement: Predicate.Refinement<NoInfer<A>, B>): Effect<B, E | Cause.NoSuchElementError, R>; // overload 10
export declare const filterOrFail: <A, E, R>(self: Effect<A, E, R>, predicate: Predicate.Predicate<NoInfer<A>>): Effect<A, E | Cause.NoSuchElementError, R>; // overload 11
export declare const filterOrFail: <A, E, R, B, X>(self: Effect<A, E, R>, filter: Filter.Filter<A, B, X>): Effect<B, E | Cause.NoSuchElementError, R>; // overload 12
export declare const ignoreCause: <Arg extends Effect<any, any, any> | { readonly log?: boolean | LogLevel | undefined; } | undefined = { readonly log?: boolean | LogLevel | undefined; }>(effectOrOptions?: Arg, options?: { readonly log?: boolean | LogLevel | undefined; } | undefined): [Arg] extends [Effect<infer _A, infer _E, infer _R>] ? Effect<void, never, _R> : <A, E, R>(self: Effect<A, E, R>) => Effect<void, never, R>;
export declare const isFailure: <A, E, R>(self: Effect<A, E, R>): Effect<boolean, never, R>;
export declare const logError: (...message: ReadonlyArray<any>): Effect<void>;
export declare const mapError: <E, E2>(f: (e: E) => E2): <A, R>(self: Effect<A, E, R>) => Effect<A, E2, R>; // overload 1
export declare const mapError: <A, E, R, E2>(self: Effect<A, E, R>, f: (e: E) => E2): Effect<A, E2, R>; // overload 2
export declare const mapErrorEager: <E, E2>(f: (e: E) => E2): <A, R>(self: Effect<A, E, R>) => Effect<A, E2, R>; // overload 1
export declare const mapErrorEager: <A, E, R, E2>(self: Effect<A, E, R>, f: (e: E) => E2): Effect<A, E2, R>; // overload 2
export declare const match: <E, A2, A, A3>(options: { readonly onFailure: (error: E) => A2; readonly onSuccess: (value: A) => A3; }): <R>(self: Effect<A, E, R>) => Effect<A2 | A3, never, R>; // overload 1
export declare const match: <A, E, R, A2, A3>(self: Effect<A, E, R>, options: { readonly onFailure: (error: E) => A2; readonly onSuccess: (value: A) => A3; }): Effect<A2 | A3, never, R>; // overload 2
export declare const matchCause: <E, A2, A, A3>(options: { readonly onFailure: (cause: Cause.Cause<E>) => A2; readonly onSuccess: (a: A) => A3; }): <R>(self: Effect<A, E, R>) => Effect<A2 | A3, never, R>; // overload 1
export declare const matchCause: <A, E, R, A2, A3>(self: Effect<A, E, R>, options: { readonly onFailure: (cause: Cause.Cause<E>) => A2; readonly onSuccess: (a: A) => A3; }): Effect<A2 | A3, never, R>; // overload 2
export declare const matchCauseEager: <E, A2, A, A3>(options: { readonly onFailure: (cause: Cause.Cause<E>) => A2; readonly onSuccess: (value: A) => A3; }): <R>(self: Effect<A, E, R>) => Effect<A2 | A3, never, R>; // overload 1
export declare const matchCauseEager: <A, E, R, A2, A3>(self: Effect<A, E, R>, options: { readonly onFailure: (cause: Cause.Cause<E>) => A2; readonly onSuccess: (value: A) => A3; }): Effect<A2 | A3, never, R>; // overload 2
export declare const matchCauseEffect: <E, A2, E2, R2, A, A3, E3, R3>(options: { readonly onFailure: (cause: Cause.Cause<E>) => Effect<A2, E2, R2>; readonly onSuccess: (a: A) => Effect<A3, E3, R3>; }): <R>(self: Effect<A, E, R>) => Effect<A2 | A3, E2 | E3, R2 | R3 | R>; // overload 1
export declare const matchCauseEffect: <A, E, R, A2, E2, R2, A3, E3, R3>(self: Effect<A, E, R>, options: { readonly onFailure: (cause: Cause.Cause<E>) => Effect<A2, E2, R2>; readonly onSuccess: (a: A) => Effect<A3, E3, R3>; }): Effect<A2 | A3, E2 | E3, R2 | R3 | R>; // overload 2
export declare const matchCauseEffectEager: <E, A2, E2, R2, A, A3, E3, R3>(options: { readonly onFailure: (cause: Cause.Cause<E>) => Effect<A2, E2, R2>; readonly onSuccess: (a: A) => Effect<A3, E3, R3>; }): <R>(self: Effect<A, E, R>) => Effect<A2 | A3, E2 | E3, R2 | R3 | R>; // overload 1
export declare const matchCauseEffectEager: <A, E, R, A2, E2, R2, A3, E3, R3>(self: Effect<A, E, R>, options: { readonly onFailure: (cause: Cause.Cause<E>) => Effect<A2, E2, R2>; readonly onSuccess: (a: A) => Effect<A3, E3, R3>; }): Effect<A2 | A3, E2 | E3, R2 | R3 | R>; // overload 2
export declare const matchEager: <E, A2, A, A3>(options: { readonly onFailure: (error: E) => A2; readonly onSuccess: (value: A) => A3; }): <R>(self: Effect<A, E, R>) => Effect<A2 | A3, never, R>; // overload 1
export declare const matchEager: <A, E, R, A2, A3>(self: Effect<A, E, R>, options: { readonly onFailure: (error: E) => A2; readonly onSuccess: (value: A) => A3; }): Effect<A2 | A3, never, R>; // overload 2
export declare const matchEffect: <E, A2, E2, R2, A, A3, E3, R3>(options: { readonly onFailure: (e: E) => Effect<A2, E2, R2>; readonly onSuccess: (a: A) => Effect<A3, E3, R3>; }): <R>(self: Effect<A, E, R>) => Effect<A2 | A3, E2 | E3, R2 | R3 | R>; // overload 1
export declare const matchEffect: <A, E, R, A2, E2, R2, A3, E3, R3>(self: Effect<A, E, R>, options: { readonly onFailure: (e: E) => Effect<A2, E2, R2>; readonly onSuccess: (a: A) => Effect<A3, E3, R3>; }): Effect<A2 | A3, E2 | E3, R2 | R3 | R>; // overload 2
export declare const onError: <E, X, R2>(cleanup: (cause: Cause.Cause<E>) => Effect<X, never, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A, E, R2 | R>; // overload 1
export declare const onError: <A, E, R, X, R2>(self: Effect<A, E, R>, cleanup: (cause: Cause.Cause<E>) => Effect<X, never, R2>): Effect<A, E, R2 | R>; // overload 2
export declare const onErrorIf: <E, Result extends Filter.ResultOrBool, XE, XR>(filter: Filter.OrPredicate<Cause.Cause<E>, Result>, f: (failure: Filter.Pass<Cause.Cause<E>, Result>, cause: Cause.Cause<E>) => Effect<void, XE, XR>): <A, R>(self: Effect<A, E, R>) => Effect<A, E | XE, R | XR>; // overload 1
export declare const onErrorIf: <A, E, R, XE, XR, Result extends Filter.ResultOrBool>(self: Effect<A, E, R>, filter: Filter.OrPredicate<Cause.Cause<E>, Result>, f: (failure: Filter.Pass<Cause.Cause<E>, Result>, cause: Cause.Cause<E>) => Effect<void, XE, XR>): Effect<A, E | XE, R | XR>; // overload 2
export declare const orElseSucceed: <A2>(evaluate: LazyArg<A2>): <A, E, R>(self: Effect<A, E, R>) => Effect<A2 | A, never, R>; // overload 1
export declare const orElseSucceed: <A, E, R, A2>(self: Effect<A, E, R>, evaluate: LazyArg<A2>): Effect<A | A2, never, R>; // overload 2
export declare const repeatOrElse: <R2, A, B, E, E2, E3, R3>(schedule: Schedule<B, A, E2, R2>, orElse: (error: E | E2, option: Option<B>) => Effect<B, E3, R3>): <R>(self: Effect<A, E, R>) => Effect<B, E3, R | R2 | R3>; // overload 1
export declare const repeatOrElse: <A, E, R, R2, B, E2, E3, R3>(self: Effect<A, E, R>, schedule: Schedule<B, A, E2, R2>, orElse: (error: E | E2, option: Option<B>) => Effect<B, E3, R3>): Effect<B, E3, R | R2 | R3>; // overload 2
export declare const retry: <E, O extends Retry.Options<E>>(options: O): <A, R>(self: Effect<A, E, R>) => Retry.Return<R, E, A, O>; // overload 1
export declare const retry: <B, E, Error, Env>(policy: Schedule<B, NoInfer<E>, Error, Env>): <A, R>(self: Effect<A, E, R>) => Effect<A, E | Error, R | Env>; // overload 2
export declare const retry: <B, E, Error, Env>(builder: ($: <O, SE, R>(_: Schedule<O, NoInfer<E>, SE, R>) => Schedule<O, E, SE, R>) => Schedule<B, NoInfer<E>, Error, Env>): <A, R>(self: Effect<A, E, R>) => Effect<A, E | Error, R | Env>; // overload 3
export declare const retry: <A, E, R, O extends Retry.Options<E>>(self: Effect<A, E, R>, options: O): Retry.Return<R, E, A, O>; // overload 4
export declare const retry: <A, E, R, B, Error, Env>(self: Effect<A, E, R>, policy: Schedule<B, NoInfer<E>, Error, Env>): Effect<A, E | Error, R | Env>; // overload 5
export declare const retry: <A, E, R, B, Error, Env>(self: Effect<A, E, R>, builder: ($: <O, SE, R>(_: Schedule<O, NoInfer<E>, SE, R>) => Schedule<O, E, SE, R>) => Schedule<B, NoInfer<E>, Error, Env>): Effect<A, E | Error, R | Env>; // overload 6
export declare const retryOrElse: <A1, E, E1, R1, A2, E2, R2>(policy: Schedule<A1, NoInfer<E>, E1, R1>, orElse: (e: NoInfer<E>, out: A1) => Effect<A2, E2, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A | A2, E1 | E2, R | R1 | R2>; // overload 1
export declare const retryOrElse: <A, E, R, A1, E1, R1, A2, E2, R2>(self: Effect<A, E, R>, policy: Schedule<A1, NoInfer<E>, E1, R1>, orElse: (e: NoInfer<E>, out: A1) => Effect<A2, E2, R2>): Effect<A | A2, E1 | E2, R | R1 | R2>; // overload 2
export declare const sandbox: <A, E, R>(self: Effect<A, E, R>): Effect<A, Cause.Cause<E>, R>;
export declare const satisfiesErrorType: <E>(): <A, E2 extends E, R>(effect: Effect<A, E2, R>) => Effect<A, E2, R>;
export declare const tapCause: <E, X, E2, R2>(f: (cause: Cause.Cause<NoInfer<E>>) => Effect<X, E2, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A, E | E2, R2 | R>; // overload 1
export declare const tapCause: <A, E, R, X, E2, R2>(self: Effect<A, E, R>, f: (cause: Cause.Cause<E>) => Effect<X, E2, R2>): Effect<A, E | E2, R | R2>; // overload 2
export declare const tapCauseIf: <E, Result extends Filter.ResultOrBool, B, E2, R2>(filter: Filter.OrPredicate<Cause.Cause<E>, Result>, f: (a: Filter.Pass<Cause.Cause<E>, Result>, cause: Cause.Cause<E>) => Effect<B, E2, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A, E | E2, R | R2>; // overload 1
export declare const tapCauseIf: <A, E, R, Result extends Filter.ResultOrBool, B, E2, R2>(self: Effect<A, E, R>, filter: Filter.OrPredicate<Cause.Cause<E>, Result>, f: (a: Filter.Pass<Cause.Cause<E>, Result>, cause: Cause.Cause<E>) => Effect<B, E2, R2>): Effect<A, E | E2, R | R2>; // overload 2
export declare const tapError: <E, X, E2, R2>(f: (e: NoInfer<E>) => Effect<X, E2, R2>): <A, R>(self: Effect<A, E, R>) => Effect<A, E | E2, R2 | R>; // overload 1
export declare const tapError: <A, E, R, X, E2, R2>(self: Effect<A, E, R>, f: (e: E) => Effect<X, E2, R2>): Effect<A, E | E2, R | R2>; // overload 2
export declare const tapErrorTag: <const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, E, A1, E1, R1>(k: K, f: (e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Effect<A1, E1, R1>): <A, R>(self: Effect<A, E, R>) => Effect<A, E | E1, R1 | R>; // overload 1
export declare const tapErrorTag: <A, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, R1, E1, A1>(self: Effect<A, E, R>, k: K, f: (e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Effect<A1, E1, R1>): Effect<A, E | E1, R | R1>; // overload 2
export declare const timeoutOrElse: <A2, E2, R2>(options: { readonly duration: Duration.Input; readonly onTimeout: LazyArg<Effect<A2, E2, R2>>; }): <A, E, R>(self: Effect<A, E, R>) => Effect<A | A2, E | E2, R | R2>; // overload 1
export declare const timeoutOrElse: <A, E, R, A2, E2, R2>(self: Effect<A, E, R>, options: { readonly duration: Duration.Input; readonly onTimeout: LazyArg<Effect<A2, E2, R2>>; }): Effect<A | A2, E | E2, R | R2>; // overload 2
export declare const trackErrors: <Input, State, E>(metric: Metric.Metric<Input, State>, f: (error: E) => Input): <A, R>(self: Effect<A, E, R>) => Effect<A, E, R>; // overload 1
export declare const trackErrors: <State, E>(metric: Metric.Metric<NoInfer<E>, State>): <A, R>(self: Effect<A, E, R>) => Effect<A, E, R>; // overload 2
export declare const trackErrors: <A, E, R, Input, State>(self: Effect<A, E, R>, metric: Metric.Metric<Input, State>, f: (error: E) => Input): Effect<A, E, R>; // overload 3
export declare const trackErrors: <A, E, R, State>(self: Effect<A, E, R>, metric: Metric.Metric<NoInfer<E>, State>): Effect<A, E, R>; // overload 4
```

## Other Exports (Non-Function)

- `Error` (type)
- `Retry` (namespace)
- `retryTransaction` (variable)
