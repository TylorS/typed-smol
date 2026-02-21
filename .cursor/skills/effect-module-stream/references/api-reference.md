# API Reference: effect/Stream

- Import path: `effect/Stream`
- Source file: `packages/effect/src/Stream.ts`
- Function exports (callable): 215
- Non-function exports: 15

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `accumulate`
- `aggregate`
- `aggregateWithin`
- `bind`
- `bindEffect`
- `bindTo`
- `broadcast`
- `buffer`
- `bufferArray`
- `callback`
- `catch`
- `catchCause`
- `catchCauseIf`
- `catchIf`
- `catchReason`
- `catchReasons`
- `catchTag`
- `catchTags`

## All Function Signatures

```ts
export declare const accumulate: <A, E, R>(self: Stream<A, E, R>): Stream<Arr.NonEmptyArray<A>, E, R>;
export declare const aggregate: <B, A, A2, E2, R2>(sink: Sink.Sink<B, A | A2, A2, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<B, E2 | E, R2 | R>; // overload 1
export declare const aggregate: <A, E, R, B, A2, E2, R2>(self: Stream<A, E, R>, sink: Sink.Sink<B, A | A2, A2, E2, R2>): Stream<B, E | E2, R | R2>; // overload 2
export declare const aggregateWithin: <B, A, A2, E2, R2, C, E3, R3>(sink: Sink.Sink<B, A | A2, A2, E2, R2>, schedule: Schedule.Schedule<C, Option.Option<B>, E3, R3>): <E, R>(self: Stream<A, E, R>) => Stream<B, E2 | E | E3, R2 | R3 | R>; // overload 1
export declare const aggregateWithin: <A, E, R, B, A2, E2, R2, C, E3, R3>(self: Stream<A, E, R>, sink: Sink.Sink<B, A | A2, A2, E2, R2>, schedule: Schedule.Schedule<C, Option.Option<B>, E3, R3>): Stream<B, E | E2 | E3, R | R2 | R3>; // overload 2
export declare const bind: <N extends string, A, B, E2, R2>(tag: Exclude<N, keyof A>, f: (_: NoInfer<A>) => Stream<B, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Stream<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }, E2 | E, R2 | R>; // overload 1
export declare const bind: <A, E, R, N extends string, B, E2, R2>(self: Stream<A, E, R>, tag: Exclude<N, keyof A>, f: (_: NoInfer<A>) => Stream<B, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): Stream<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }, E | E2, R | R2>; // overload 2
export declare const bindEffect: <N extends string, A, B, E2, R2>(tag: Exclude<N, keyof A>, f: (_: NoInfer<A>) => Effect.Effect<B, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; readonly unordered?: boolean | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<{ [K in keyof A | N]: K extends keyof A ? A[K] : B; }, E | E2, R | R2>; // overload 1
export declare const bindEffect: <A, E, R, N extends string, B, E2, R2>(self: Stream<A, E, R>, tag: Exclude<N, keyof A>, f: (_: NoInfer<A>) => Effect.Effect<B, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; readonly unordered?: boolean | undefined; }): Stream<{ [K in keyof A | N]: K extends keyof A ? A[K] : B; }, E | E2, R | R2>; // overload 2
export declare const bindTo: <N extends string>(name: N): <A, E, R>(self: Stream<A, E, R>) => Stream<{ [K in N]: A; }, E, R>; // overload 1
export declare const bindTo: <A, E, R, N extends string>(self: Stream<A, E, R>, name: N): Stream<{ [K in N]: A; }, E, R>; // overload 2
export declare const broadcast: (options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; } | { readonly capacity: number; readonly strategy?: "sliding" | "dropping" | "suspend" | undefined; readonly replay?: number | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<Stream<A, E>, never, Scope.Scope | R>; // overload 1
export declare const broadcast: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; } | { readonly capacity: number; readonly strategy?: "sliding" | "dropping" | "suspend" | undefined; readonly replay?: number | undefined; }): Effect.Effect<Stream<A, E>, never, Scope.Scope | R>; // overload 2
export declare const buffer: (options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const buffer: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): Stream<A, E, R>; // overload 2
export declare const bufferArray: (options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const bufferArray: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): Stream<A, E, R>; // overload 2
export declare const callback: <A, E = never, R = never>(f: (queue: Queue.Queue<A, E | Cause.Done>) => Effect.Effect<unknown, E, R | Scope.Scope>, options?: { readonly bufferSize?: number | undefined; readonly strategy?: "sliding" | "dropping" | "suspend" | undefined; }): Stream<A, E, Exclude<R, Scope.Scope>>;
export declare const catch: <E, A2, E2, R2>(f: (error: E) => Stream<A2, E2, R2>): <A, R>(self: Stream<A, E, R>) => Stream<A | A2, E2, R2 | R>; // overload 1
export declare const catch: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (error: E) => Stream<A2, E2, R2>): Stream<A | A2, E2, R | R2>; // overload 2
export declare const catchCause: <E, A2, E2, R2>(f: (cause: Cause.Cause<E>) => Stream<A2, E2, R2>): <A, R>(self: Stream<A, E, R>) => Stream<A | A2, E2, R2 | R>; // overload 1
export declare const catchCause: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (cause: Cause.Cause<E>) => Stream<A2, E2, R2>): Stream<A | A2, E2, R | R2>; // overload 2
export declare const catchCauseIf: <E, Result extends Filter.ResultOrBool<Cause.Cause<any>>, A2, E2, R2>(filter: Filter.OrPredicate<Cause.Cause<E>, Result>, f: (failure: Filter.Pass<Cause.Cause<E>, Result>, cause: Cause.Cause<E>) => Stream<A2, E2, R2>): <A, R>(self: Stream<A, E, R>) => Stream<A | A2, Cause.Cause.Error<Filter.Fail<Cause.Cause<E>, Result>> | E2, R2 | R>; // overload 1
export declare const catchCauseIf: <A, E, R, A2, E2, R2, Result extends Filter.ResultOrBool<Cause.Cause<any>>>(self: Stream<A, E, R>, filter: Filter.OrPredicate<Cause.Cause<E>, Result>, f: (failure: Filter.Pass<Cause.Cause<E>, Result>, cause: Cause.Cause<E>) => Stream<A2, E2, R2>): Stream<A | A2, Cause.Cause.Error<Filter.Fail<Cause.Cause<E>, Result>> | E2, R | R2>; // overload 2
export declare const catchIf: <E, EB extends E, A2, E2, R2, A3 = never, E3 = Exclude<E, EB>, R3 = never>(refinement: Refinement<NoInfer<E>, EB>, f: (e: EB) => Stream<A2, E2, R2>, orElse?: ((e: Exclude<E, EB>) => Stream<A3, E3, R3>) | undefined): <A, R>(self: Stream<A, E, R>) => Stream<A2 | A | A3, E2 | E3, R2 | R | R3>; // overload 1
export declare const catchIf: <E, Result extends Filter.ResultOrBool, A2, E2, R2, A3 = never, E3 = Filter.Fail<E, Result>, R3 = never>(filter: Filter.OrPredicate<NoInfer<E>, Result>, f: (failure: Filter.Pass<E, Result>) => Stream<A2, E2, R2>, orElse?: ((failure: Filter.Fail<E, Result>) => Stream<A3, E3, R3>) | undefined): <A, R>(self: Stream<A, E, R>) => Stream<A | A2 | A3, E2 | E3, R | R2 | R3>; // overload 2
export declare const catchIf: <A, E, R, EB extends E, A2, E2, R2, A3 = never, E3 = Exclude<E, EB>, R3 = never>(self: Stream<A, E, R>, refinement: Refinement<E, EB>, f: (e: EB) => Stream<A2, E2, R2>, orElse?: ((e: Exclude<E, EB>) => Stream<A3, E3, R3>) | undefined): Stream<A | A2 | A3, E2 | E3, R | R2 | R3>; // overload 3
export declare const catchIf: <A, E, R, Result extends Filter.ResultOrBool, A2, E2, R2, A3 = never, E3 = Filter.Fail<E, Result>, R3 = never>(self: Stream<A, E, R>, filter: Filter.OrPredicate<NoInfer<E>, Result>, f: (failure: Filter.Pass<E, Result>) => Stream<A2, E2, R2>, orElse?: ((failure: Filter.Fail<E, Result>) => Stream<A3, E3, R3>) | undefined): Stream<A | A2 | A3, E2 | E3, R | R2 | R3>; // overload 4
export declare const catchReason: <K extends Tags<E>, E, RK extends ReasonTags<ExtractTag<NoInfer<E>, K>>, A2, E2, R2, A3 = unassigned, E3 = never, R3 = never>(errorTag: K, reasonTag: RK, f: (reason: ExtractReason<ExtractTag<NoInfer<E>, K>, RK>) => Stream<A2, E2, R2>, orElse?: ((reason: ExcludeReason<ExtractTag<NoInfer<E>, K>, RK>) => Stream<A3, E3, R3>) | undefined): <A, R>(self: Stream<A, E, R>) => Stream<A | A2 | Exclude<A3, unassigned>, (A3 extends unassigned ? E : ExcludeTag<E, K>) | E2 | E3, R | R2 | R3>; // overload 1
export declare const catchReason: <A, E, R, K extends Tags<E>, RK extends ReasonTags<ExtractTag<E, K>>, A2, E2, R2, A3 = unassigned, E3 = never, R3 = never>(self: Stream<A, E, R>, errorTag: K, reasonTag: RK, f: (reason: ExtractReason<ExtractTag<E, K>, RK>) => Stream<A2, E2, R2>, orElse?: ((reason: ExcludeReason<ExtractTag<E, K>, RK>) => Stream<A3, E3, R3>) | undefined): Stream<A | A2 | Exclude<A3, unassigned>, (A3 extends unassigned ? E : ExcludeTag<E, K>) | E2 | E3, R | R2 | R3>; // overload 2
export declare const catchReasons: <K extends Tags<E>, E, Cases extends { [RK in ReasonTags<ExtractTag<NoInfer<E>, K>>]+?: (reason: ExtractReason<ExtractTag<NoInfer<E>, K>, RK>) => Stream<any, any, any>; }, A2 = unassigned, E2 = never, R2 = never>(errorTag: K, cases: Cases, orElse?: ((reason: ExcludeReason<ExtractTag<NoInfer<E>, K>, Extract<keyof Cases, string>>) => Stream<A2, E2, R2>) | undefined): <A, R>(self: Stream<A, E, R>) => Stream<A | Exclude<A2, unassigned> | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Stream<infer A, any, any> ? A : never; }[keyof Cases], (A2 extends unassigned ? E : ExcludeTag<E, K>) | E2 | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Stream<any, infer E, any> ? E : never; }[keyof Cases], R | R2 | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Stream<any, any, infer R> ? R : never; }[keyof Cases]>; // overload 1
export declare const catchReasons: <A, E, R, K extends Tags<E>, Cases extends { [RK in ReasonTags<ExtractTag<E, K>>]+?: (reason: ExtractReason<ExtractTag<E, K>, RK>) => Stream<any, any, any>; }, A2 = unassigned, E2 = never, R2 = never>(self: Stream<A, E, R>, errorTag: K, cases: Cases, orElse?: ((reason: ExcludeReason<ExtractTag<NoInfer<E>, K>, Extract<keyof Cases, string>>) => Stream<A2, E2, R2>) | undefined): Stream<A | Exclude<A2, unassigned> | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Stream<infer A, any, any> ? A : never; }[keyof Cases], (A2 extends unassigned ? E : ExcludeTag<E, K>) | E2 | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Stream<any, infer E, any> ? E : never; }[keyof Cases], R | R2 | { [RK in keyof Cases]: Cases[RK] extends (...args: Array<any>) => Stream<any, any, infer R> ? R : never; }[keyof Cases]>; // overload 2
export declare const catchTag: <const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, E, A1, E1, R1, A2 = never, E2 = ExcludeTag<E, K extends readonly [string, ...string[]] ? K[number] : K>, R2 = never>(k: K, f: (e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Stream<A1, E1, R1>, orElse?: ((e: ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Stream<A2, E2, R2>) | undefined): <A, R>(self: Stream<A, E, R>) => Stream<A1 | A | A2, E1 | E2, R1 | R | R2>; // overload 1
export declare const catchTag: <A, E, R, const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, R1, E1, A1, A2 = never, E2 = ExcludeTag<E, K extends readonly [string, ...string[]] ? K[number] : K>, R2 = never>(self: Stream<A, E, R>, k: K, f: (e: ExtractTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Stream<A1, E1, R1>, orElse?: ((e: ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>) => Stream<A2, E2, R2>) | undefined): Stream<A1 | A | A2, E1 | E2, R1 | R | R2>; // overload 2
export declare const catchTags: <E, Cases extends (E extends { _tag: string; } ? { [K in E["_tag"]]+?: (error: Extract<E, { _tag: K; }>) => Stream<any, any, any>; } : {}), A2 = never, E2 = Exclude<E, { _tag: keyof Cases; }>, R2 = never>(cases: Cases, orElse?: ((e: Exclude<E, { _tag: keyof Cases; }>) => Stream<A2, E2, R2>) | undefined): <A, R>(self: Stream<A, E, R>) => Stream<A | A2 | { [K in keyof Cases]: Cases[K] extends ((...args: Array<any>) => Stream<infer A, any, any>) ? A : never; }[keyof Cases], E2 | { [K in keyof Cases]: Cases[K] extends ((...args: Array<any>) => Stream<any, infer E, any>) ? E : never; }[keyof Cases], R | R2 | { [K in keyof Cases]: Cases[K] extends ((...args: Array<any>) => Stream<any, any, infer R>) ? R : never; }[keyof Cases]>; // overload 1
export declare const catchTags: <R, E, A, Cases extends (E extends { _tag: string; } ? { [K in E["_tag"]]+?: (error: Extract<E, { _tag: K; }>) => Stream<any, any, any>; } : {}), A2 = never, E2 = Exclude<E, { _tag: keyof Cases; }>, R2 = never>(self: Stream<A, E, R>, cases: Cases, orElse?: ((e: Exclude<E, { _tag: keyof Cases; }>) => Stream<A2, E2, R2>) | undefined): Stream<A | A2 | { [K in keyof Cases]: Cases[K] extends ((...args: Array<any>) => Stream<infer A, any, any>) ? A : never; }[keyof Cases], E2 | { [K in keyof Cases]: Cases[K] extends ((...args: Array<any>) => Stream<any, infer E, any>) ? E : never; }[keyof Cases], R | R2 | { [K in keyof Cases]: Cases[K] extends ((...args: Array<any>) => Stream<any, any, infer R>) ? R : never; }[keyof Cases]>; // overload 2
export declare const changes: <A, E, R>(self: Stream<A, E, R>): Stream<A, E, R>;
export declare const changesWith: <A>(f: (x: A, y: A) => boolean): <E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const changesWith: <A, E, R>(self: Stream<A, E, R>, f: (x: A, y: A) => boolean): Stream<A, E, R>; // overload 2
export declare const changesWithEffect: <A, E2, R2>(f: (x: A, y: A) => Effect.Effect<boolean, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<A, E | E2, R | R2>; // overload 1
export declare const changesWithEffect: <A, E, R, E2, R2>(self: Stream<A, E, R>, f: (x: A, y: A) => Effect.Effect<boolean, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const chunks: <A, E, R>(self: Stream<A, E, R>): Stream<Arr.NonEmptyReadonlyArray<A>, E, R>;
export declare const collect: <A, E, R>(self: Stream<A, E, R>): Stream<Array<A>, E, R>;
export declare const combine: <A2, E2, R2, S, E, A, A3, E3, R3>(that: Stream<A2, E2, R2>, s: LazyArg<S>, f: (s: S, pullLeft: Pull.Pull<A, E, void>, pullRight: Pull.Pull<A2, E2, void>) => Effect.Effect<readonly [A3, S], E3, R3>): <R>(self: Stream<A, E, R>) => Stream<A3, E3, R2 | R3 | R>; // overload 1
export declare const combine: <A, E, R, A2, E2, R2, S, A3, E3, R3>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>, s: LazyArg<S>, f: (s: S, pullLeft: Pull.Pull<A, E, void>, pullRight: Pull.Pull<A2, E2, void>) => Effect.Effect<readonly [A3, S], E3, R3>): Stream<A3, E3, R | R2 | R3>; // overload 2
export declare const combineArray: <A2, E2, R2, S, E, A, A3, E3, R3>(that: Stream<A2, E2, R2>, s: LazyArg<S>, f: (s: S, pullLeft: Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void>, pullRight: Pull.Pull<Arr.NonEmptyReadonlyArray<A2>, E2, void>) => Effect.Effect<readonly [Arr.NonEmptyReadonlyArray<A3>, S], E3, R3>): <R>(self: Stream<A, E, R>) => Stream<A3, Pull.ExcludeDone<E3>, R2 | R3 | R>; // overload 1
export declare const combineArray: <R, A2, E2, R2, S, E, A, A3, E3, R3>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>, s: LazyArg<S>, f: (s: S, pullLeft: Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void>, pullRight: Pull.Pull<Arr.NonEmptyReadonlyArray<A2>, E2, void>) => Effect.Effect<readonly [Arr.NonEmptyReadonlyArray<A3>, S], E3, R3>): Stream<A3, Pull.ExcludeDone<E3>, R | R2 | R3>; // overload 2
export declare const concat: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A | A2, E | E2, R | R2>; // overload 1
export declare const concat: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<A | A2, E | E2, R | R2>; // overload 2
export declare const cross: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<[AL, AR], EL | ER, RL | RR>; // overload 1
export declare const cross: <AL, ER, RR, AR, EL, RL>(left: Stream<AL, ER, RR>, right: Stream<AR, EL, RL>): Stream<[AL, AR], EL | ER, RL | RR>; // overload 2
export declare const crossWith: <AR, ER, RR, AL, A>(right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): <EL, RL>(left: Stream<AL, EL, RL>) => Stream<A, EL | ER, RL | RR>; // overload 1
export declare const crossWith: <AL, EL, RL, AR, ER, RR, A>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): Stream<A, EL | ER, RL | RR>; // overload 2
export declare const debounce: (duration: Duration.Input): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const debounce: <A, E, R>(self: Stream<A, E, R>, duration: Duration.Input): Stream<A, E, R>; // overload 2
export declare const decodeText: <Arg extends Stream<Uint8Array, any, any> | { readonly encoding?: string | undefined; } | undefined = { readonly encoding?: string | undefined; }>(streamOrOptions?: Arg, options?: { readonly encoding?: string | undefined; } | undefined): [Arg] extends [Stream<Uint8Array, infer _E, infer _R>] ? Stream<string, _E, _R> : <E, R>(self: Stream<Uint8Array, E, R>) => Stream<string, E, R>;
export declare const die: (defect: unknown): Stream<never>;
export declare const drain: <A, E, R>(self: Stream<A, E, R>): Stream<never, E, R>;
export declare const drainFork: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const drainFork: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const drop: (n: number): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const drop: <A, E, R>(self: Stream<A, E, R>, n: number): Stream<A, E, R>; // overload 2
export declare const dropRight: (n: number): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const dropRight: <A, E, R>(self: Stream<A, E, R>, n: number): Stream<A, E, R>; // overload 2
export declare const dropUntil: <A>(predicate: (a: NoInfer<A>, index: number) => boolean): <E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const dropUntil: <A, E, R>(self: Stream<A, E, R>, predicate: (a: NoInfer<A>, index: number) => boolean): Stream<A, E, R>; // overload 2
export declare const dropUntilEffect: <A, E2, R2>(predicate: (a: NoInfer<A>, index: number) => Effect.Effect<boolean, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const dropUntilEffect: <A, E, R, E2, R2>(self: Stream<A, E, R>, predicate: (a: NoInfer<A>, index: number) => Effect.Effect<boolean, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const dropWhile: <A>(predicate: (a: NoInfer<A>, index: number) => boolean): <E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const dropWhile: <A, B, X>(f: Filter.Filter<NoInfer<A>, B, X>): <E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 2
export declare const dropWhile: <A, E, R>(self: Stream<A, E, R>, predicate: (a: NoInfer<A>, index: number) => boolean): Stream<A, E, R>; // overload 3
export declare const dropWhile: <A, E, R, B, X>(self: Stream<A, E, R>, f: Filter.Filter<NoInfer<A>, B, X>): Stream<A, E, R>; // overload 4
export declare const dropWhileEffect: <A, E2, R2>(predicate: (a: NoInfer<A>, index: number) => Effect.Effect<boolean, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const dropWhileEffect: <A, E, R, E2, R2>(self: Stream<A, E, R>, predicate: (a: A, index: number) => Effect.Effect<boolean, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const encodeText: <E, R>(self: Stream<string, E, R>): Stream<Uint8Array, E, R>;
export declare const ensuring: <R2>(finalizer: Effect.Effect<unknown, never, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R | R2>; // overload 1
export declare const ensuring: <A, E, R, R2>(self: Stream<A, E, R>, finalizer: Effect.Effect<unknown, never, R2>): Stream<A, E, R | R2>; // overload 2
export declare const fail: <E>(error: E): Stream<never, E>;
export declare const failCause: <E>(cause: Cause.Cause<E>): Stream<never, E>;
export declare const failCauseSync: <E>(evaluate: LazyArg<Cause.Cause<E>>): Stream<never, E>;
export declare const failSync: <E>(evaluate: LazyArg<E>): Stream<never, E>;
export declare const filter: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const filter: <A, Result extends Filter.ResultOrBool>(filter: Filter.OrPredicate<NoInfer<A>, Result>): <E, R>(self: Stream<A, E, R>) => Stream<Filter.Pass<A, Result>, E, R>; // overload 2
export declare const filter: <A, E, R, B extends A>(self: Stream<A, E, R>, refinement: Refinement<A, B>): Stream<B, E, R>; // overload 3
export declare const filter: <A, E, R, Result extends Filter.ResultOrBool>(self: Stream<A, E, R>, filter: Filter.OrPredicate<NoInfer<A>, Result>): Stream<Filter.Pass<A, Result>, E, R>; // overload 4
export declare const filterEffect: <A, B, X, EX, RX>(filter: Filter.FilterEffect<A, B, X, EX, RX>): <E, R>(self: Stream<A, E, R>) => Stream<B, E | EX, R | RX>; // overload 1
export declare const filterEffect: <A, E, R, B, X, EX, RX>(self: Stream<A, E, R>, filter: Filter.FilterEffect<A, B, X, EX, RX>): Stream<B, E | EX, R | RX>; // overload 2
export declare const flatMap: <A, A2, E2, R2>(f: (a: A) => Stream<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Stream<A2, E2 | E, R2 | R>; // overload 1
export declare const flatMap: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (a: A) => Stream<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): Stream<A2, E | E2, R | R2>; // overload 2
export declare const flatten: <Arg extends Stream<Stream<any, any, any>, any, any> | { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined = { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; }>(selfOrOptions?: Arg, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): [Arg] extends [Stream<Stream<infer _A, infer _E, infer _R>, infer _E2, infer _R2>] ? Stream<_A, _E | _E2, _R | _R2> : <A, E, R, E2, R2>(self: Stream<Stream<A, E, R>, E2, R2>) => Stream<A, E | E2, R | R2>;
export declare const flattenArray: <A, E, R>(self: Stream<Arr.NonEmptyReadonlyArray<A>, E, R>): Stream<A, E, R>;
export declare const flattenEffect: <Arg extends Stream<Effect.Effect<any, any, any>, any, any> | { readonly concurrency?: number | "unbounded" | undefined; readonly unordered?: boolean | undefined; } | undefined = { readonly concurrency?: number | "unbounded" | undefined; readonly unordered?: boolean | undefined; }>(selfOrOptions?: Arg, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly unordered?: boolean | undefined; } | undefined): [Arg] extends [Stream<Effect.Effect<infer _A, infer _EX, infer _RX>, infer _E, infer _R>] ? Stream<_A, _EX | _E, _RX | _R> : <A, EX, RX, E, R>(self: Stream<Effect.Effect<A, EX, RX>, E, R>) => Stream<A, EX | E, RX | R>;
export declare const flattenIterable: <A, E, R>(self: Stream<Iterable<A>, E, R>): Stream<A, E, R>;
export declare const flattenTake: <A, E, E2, R>(self: Stream<Take.Take<A, E>, E2, R>): Stream<A, E | E2, R>;
export declare const forever: <A, E, R>(self: Stream<A, E, R>): Stream<A, E, R>;
export declare const fromArray: <A>(array: ReadonlyArray<A>): Stream<A>;
export declare const fromArrayEffect: <A, E, R>(effect: Effect.Effect<ReadonlyArray<A>, E, R>): Stream<A, Pull.ExcludeDone<E>, R>;
export declare const fromArrays: <Arr extends ReadonlyArray<ReadonlyArray<any>>>(...arrays: Arr): Stream<Arr[number][number]>;
export declare const fromAsyncIterable: <A, E>(iterable: AsyncIterable<A>, onError: (error: unknown) => E): Stream<A, E>;
export declare const fromChannel: <Arr extends Arr.NonEmptyReadonlyArray<any>, E, R>(channel: Channel.Channel<Arr, E, void, unknown, unknown, unknown, R>): Stream<Arr extends Arr.NonEmptyReadonlyArray<infer A> ? A : never, E, R>;
export declare const fromEffect: <A, E, R>(effect: Effect.Effect<A, E, R>): Stream<A, E, R>;
export declare const fromEffectDrain: <A, E, R>(effect: Effect.Effect<A, E, R>): Stream<never, E, R>;
export declare const fromEffectRepeat: <A, E, R>(effect: Effect.Effect<A, E, R>): Stream<A, Pull.ExcludeDone<E>, R>;
export declare const fromEffectSchedule: <A, E, R, X, AS extends A, ES, RS>(effect: Effect.Effect<A, E, R>, schedule: Schedule.Schedule<X, AS, ES, RS>): Stream<A, E | ES, R | RS>;
export declare const fromEventListener: <A = unknown>(target: EventListener<A>, type: string, options?: boolean | { readonly capture?: boolean; readonly passive?: boolean; readonly once?: boolean; readonly bufferSize?: number | undefined; } | undefined): Stream<A>;
export declare const fromIterable: <A>(iterable: Iterable<A>): Stream<A>;
export declare const fromIterableEffect: <A, E, R>(iterable: Effect.Effect<Iterable<A>, E, R>): Stream<A, E, R>;
export declare const fromIterableEffectRepeat: <A, E, R>(iterable: Effect.Effect<Iterable<A>, E, R>): Stream<A, Pull.ExcludeDone<E>, R>;
export declare const fromIteratorSucceed: <A>(iterator: IterableIterator<A>, maxChunkSize?: number): Stream<A>;
export declare const fromPubSub: <A>(pubsub: PubSub.PubSub<A>): Stream<A>;
export declare const fromPubSubTake: <A, E>(pubsub: PubSub.PubSub<Take.Take<A, E>>): Stream<A, E>;
export declare const fromPull: <A, E, R, EX, RX>(pull: Effect.Effect<Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void, R>, EX, RX>): Stream<A, Pull.ExcludeDone<E> | EX, R | RX>;
export declare const fromQueue: <A, E>(queue: Queue.Dequeue<A, E>): Stream<A, Exclude<E, Cause.Done>>;
export declare const fromReadableStream: <A, E>(options: { readonly evaluate: LazyArg<ReadableStream<A>>; readonly onError: (error: unknown) => E; readonly releaseLockOnEnd?: boolean | undefined; }): Stream<A, E>;
export declare const fromSchedule: <O, E, R>(schedule: Schedule.Schedule<O, unknown, E, R>): Stream<O, E, R>;
export declare const fromSubscription: <A>(pubsub: PubSub.Subscription<A>): Stream<A>;
export declare const groupAdjacentBy: <A, K>(f: (a: NoInfer<A>) => K): <E, R>(self: Stream<A, E, R>) => Stream<readonly [K, Arr.NonEmptyArray<A>], E, R>; // overload 1
export declare const groupAdjacentBy: <A, E, R, K>(self: Stream<A, E, R>, f: (a: NoInfer<A>) => K): Stream<readonly [K, Arr.NonEmptyArray<A>], E, R>; // overload 2
export declare const groupBy: <A, K, V, E2, R2>(f: (a: NoInfer<A>) => Effect.Effect<readonly [K, V], E2, R2>, options?: { readonly bufferSize?: number | undefined; readonly idleTimeToLive?: Duration.Input | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<readonly [K, Stream<V>], E | E2, R | R2>; // overload 1
export declare const groupBy: <A, E, R, K, V, E2, R2>(self: Stream<A, E, R>, f: (a: NoInfer<A>) => Effect.Effect<readonly [K, V], E2, R2>, options?: { readonly bufferSize?: number | undefined; readonly idleTimeToLive?: Duration.Input | undefined; }): Stream<readonly [K, Stream<V>], E | E2, R | R2>; // overload 2
export declare const groupByKey: <A, K>(f: (a: NoInfer<A>) => K, options?: { readonly bufferSize?: number | undefined; readonly idleTimeToLive?: Duration.Input | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<readonly [K, Stream<A>], E, R>; // overload 1
export declare const groupByKey: <A, E, R, K>(self: Stream<A, E, R>, f: (a: NoInfer<A>) => K, options?: { readonly bufferSize?: number | undefined; readonly idleTimeToLive?: Duration.Input | undefined; }): Stream<readonly [K, Stream<A>], E, R>; // overload 2
export declare const grouped: (n: number): <A, E, R>(self: Stream<A, E, R>) => Stream<Arr.NonEmptyReadonlyArray<A>, E, R>; // overload 1
export declare const grouped: <A, E, R>(self: Stream<A, E, R>, n: number): Stream<Arr.NonEmptyReadonlyArray<A>, E, R>; // overload 2
export declare const groupedWithin: (chunkSize: number, duration: Duration.Input): <A, E, R>(self: Stream<A, E, R>) => Stream<Array<A>, E, R>; // overload 1
export declare const groupedWithin: <A, E, R>(self: Stream<A, E, R>, chunkSize: number, duration: Duration.Input): Stream<Array<A>, E, R>; // overload 2
export declare const haltWhen: <X, E2, R2>(effect: Effect.Effect<X, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const haltWhen: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, effect: Effect.Effect<X, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const ignore: <Arg extends Stream<any, any, any> | { readonly log?: boolean | LogLevel | undefined; } | undefined>(selfOrOptions: Arg, options?: { readonly log?: boolean | LogLevel | undefined; } | undefined): [Arg] extends [Stream<infer A, infer _E, infer R>] ? Stream<A, never, R> : <A, E, R>(self: Stream<A, E, R>) => Stream<A, never, R>;
export declare const ignoreCause: <Arg extends Stream<any, any, any> | { readonly log?: boolean | LogLevel | undefined; } | undefined>(streamOrOptions: Arg, options?: { readonly log?: boolean | LogLevel | undefined; } | undefined): [Arg] extends [Stream<infer A, infer _E, infer R>] ? Stream<A, never, R> : <A, E, R>(self: Stream<A, E, R>) => Stream<A, never, R>;
export declare const interleave: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A2 | A, E2 | E, R2 | R>; // overload 1
export declare const interleave: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<A | A2, E | E2, R | R2>; // overload 2
export declare const interleaveWith: <A2, E2, R2, E3, R3>(that: Stream<A2, E2, R2>, decider: Stream<boolean, E3, R3>): <A, E, R>(self: Stream<A, E, R>) => Stream<A2 | A, E2 | E3 | E, R2 | R3 | R>; // overload 1
export declare const interleaveWith: <A, E, R, A2, E2, R2, E3, R3>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>, decider: Stream<boolean, E3, R3>): Stream<A | A2, E | E2 | E3, R | R2 | R3>; // overload 2
export declare const interruptWhen: <X, E2, R2>(effect: Effect.Effect<X, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const interruptWhen: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, effect: Effect.Effect<X, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const intersperse: <A2>(element: A2): <A, E, R>(self: Stream<A, E, R>) => Stream<A2 | A, E, R>; // overload 1
export declare const intersperse: <A, E, R, A2>(self: Stream<A, E, R>, element: A2): Stream<A | A2, E, R>; // overload 2
export declare const intersperseAffixes: <A2, A3, A4>(options: { readonly start: A2; readonly middle: A3; readonly end: A4; }): <A, E, R>(self: Stream<A, E, R>) => Stream<A2 | A3 | A4 | A, E, R>; // overload 1
export declare const intersperseAffixes: <A, E, R, A2, A3, A4>(self: Stream<A, E, R>, options: { readonly start: A2; readonly middle: A3; readonly end: A4; }): Stream<A | A2 | A3 | A4, E, R>; // overload 2
export declare const isStream: (u: unknown): u is Stream<unknown, unknown, unknown>;
export declare const iterate: <A>(value: A, next: (value: A) => A): Stream<A>;
export declare const let: <N extends string, A extends object, B>(name: Exclude<N, keyof A>, f: (a: NoInfer<A>) => B): <E, R>(self: Stream<A, E, R>) => Stream<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }, E, R>; // overload 1
export declare const let: <A extends object, E, R, N extends string, B>(self: Stream<A, E, R>, name: Exclude<N, keyof A>, f: (a: NoInfer<A>) => B): Stream<{ [K in N | keyof A]: K extends keyof A ? A[K] : B; }, E, R>; // overload 2
export declare const make: <const As extends ReadonlyArray<any>>(...values: As): Stream<As[number]>;
export declare const map: <A, B>(f: (a: A, i: number) => B): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const map: <A, E, R, B>(self: Stream<A, E, R>, f: (a: A, i: number) => B): Stream<B, E, R>; // overload 2
export declare const mapAccum: <S, A, B>(initial: LazyArg<S>, f: (s: S, a: A) => readonly [state: S, values: ReadonlyArray<B>], options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const mapAccum: <A, E, R, S, B>(self: Stream<A, E, R>, initial: LazyArg<S>, f: (s: S, a: A) => readonly [state: S, values: ReadonlyArray<B>], options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): Stream<B, E, R>; // overload 2
export declare const mapAccumArray: <S, A, B>(initial: LazyArg<S>, f: (s: S, a: Arr.NonEmptyReadonlyArray<A>) => readonly [state: S, values: ReadonlyArray<B>], options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const mapAccumArray: <A, E, R, S, B>(self: Stream<A, E, R>, initial: LazyArg<S>, f: (s: S, a: Arr.NonEmptyReadonlyArray<A>) => readonly [state: S, values: ReadonlyArray<B>], options?: { readonly onHalt?: ((state: S) => Array<B>) | undefined; }): Stream<B, E, R>; // overload 2
export declare const mapAccumArrayEffect: <S, A, B, E2, R2>(initial: LazyArg<S>, f: (s: S, a: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<readonly [state: S, values: ReadonlyArray<B>], E2, R2>, options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<B, E | E2, R | R2>; // overload 1
export declare const mapAccumArrayEffect: <A, E, R, S, B, E2, R2>(self: Stream<A, E, R>, initial: LazyArg<S>, f: (s: S, a: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<readonly [state: S, values: ReadonlyArray<B>], E2, R2>, options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): Stream<B, E | E2, R | R2>; // overload 2
export declare const mapAccumEffect: <S, A, B, E2, R2>(initial: LazyArg<S>, f: (s: S, a: A) => Effect.Effect<readonly [state: S, values: ReadonlyArray<B>], E2, R2>, options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<B, E | E2, R | R2>; // overload 1
export declare const mapAccumEffect: <A, E, R, S, B, E2, R2>(self: Stream<A, E, R>, initial: LazyArg<S>, f: (s: S, a: A) => Effect.Effect<readonly [state: S, values: ReadonlyArray<B>], E2, R2>, options?: { readonly onHalt?: ((state: S) => ReadonlyArray<B>) | undefined; }): Stream<B, E | E2, R | R2>; // overload 2
export declare const mapArray: <A, B>(f: (a: Arr.NonEmptyReadonlyArray<A>, i: number) => Arr.NonEmptyReadonlyArray<B>): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const mapArray: <A, E, R, B>(self: Stream<A, E, R>, f: (a: Arr.NonEmptyReadonlyArray<A>, i: number) => Arr.NonEmptyReadonlyArray<B>): Stream<B, E, R>; // overload 2
export declare const mapArrayEffect: <A, B, E2, R2>(f: (a: Arr.NonEmptyReadonlyArray<A>, i: number) => Effect.Effect<Arr.NonEmptyReadonlyArray<B>, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<B, E | E2, R | R2>; // overload 1
export declare const mapArrayEffect: <A, E, R, B, E2, R2>(self: Stream<A, E, R>, f: (a: Arr.NonEmptyReadonlyArray<A>, i: number) => Effect.Effect<Arr.NonEmptyReadonlyArray<B>, E2, R2>): Stream<B, E | E2, R | R2>; // overload 2
export declare const mapBoth: <E, E2, A, A2>(options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): <R>(self: Stream<A, E, R>) => Stream<A2, E2, R>; // overload 1
export declare const mapBoth: <A, E, R, E2, A2>(self: Stream<A, E, R>, options: { readonly onFailure: (e: E) => E2; readonly onSuccess: (a: A) => A2; }): Stream<A2, E2, R>; // overload 2
export declare const mapEffect: <A, A2, E2, R2>(f: (a: A, i: number) => Effect.Effect<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly unordered?: boolean | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Stream<A2, E2 | E, R2 | R>; // overload 1
export declare const mapEffect: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (a: A, i: number) => Effect.Effect<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly unordered?: boolean | undefined; } | undefined): Stream<A2, E | E2, R | R2>; // overload 2
export declare const mapError: <E, E2>(f: (error: E) => E2): <A, R>(self: Stream<A, E, R>) => Stream<A, E2, R>; // overload 1
export declare const mapError: <A, E, R, E2>(self: Stream<A, E, R>, f: (error: E) => E2): Stream<A, E2, R>; // overload 2
export declare const merge: <A2, E2, R2>(that: Stream<A2, E2, R2>, options?: { readonly haltStrategy?: HaltStrategy | undefined; } | undefined): <A, E, R>(self: Stream<A, E, R>) => Stream<A | A2, E | E2, R | R2>; // overload 1
export declare const merge: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>, options?: { readonly haltStrategy?: HaltStrategy | undefined; } | undefined): Stream<A | A2, E | E2, R | R2>; // overload 2
export declare const mergeAll: (options: { readonly concurrency: number | "unbounded"; readonly bufferSize?: number | undefined; }): <A, E, R>(streams: Iterable<Stream<A, E, R>>) => Stream<A, E, R>; // overload 1
export declare const mergeAll: <A, E, R>(streams: Iterable<Stream<A, E, R>>, options: { readonly concurrency: number | "unbounded"; readonly bufferSize?: number | undefined; }): Stream<A, E, R>; // overload 2
export declare const mergeEffect: <A2, E2, R2>(effect: Effect.Effect<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const mergeEffect: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, effect: Effect.Effect<A2, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const mergeLeft: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AL, ER | EL, RR | RL>; // overload 1
export declare const mergeLeft: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AL, EL | ER, RL | RR>; // overload 2
export declare const mergeResult: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<Result.Result<A, A2>, E2 | E, R2 | R>; // overload 1
export declare const mergeResult: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<Result.Result<A, A2>, E | E2, R | R2>; // overload 2
export declare const mergeRight: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AR, ER | EL, RR | RL>; // overload 1
export declare const mergeRight: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AR, EL | ER, RL | RR>; // overload 2
export declare const mkString: <E, R>(self: Stream<string, E, R>): Effect.Effect<string, E, R>;
export declare const mkUint8Array: <E, R>(self: Stream<Uint8Array, E, R>): Effect.Effect<Uint8Array, E, R>;
export declare const onEnd: <X, EX, RX>(onEnd: Effect.Effect<X, EX, RX>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E | EX, R | RX>; // overload 1
export declare const onEnd: <A, E, R, X, EX, RX>(self: Stream<A, E, R>, onEnd: Effect.Effect<X, EX, RX>): Stream<A, E | EX, R | RX>; // overload 2
export declare const onError: <E, X, R2>(cleanup: (cause: Cause.Cause<E>) => Effect.Effect<X, never, R2>): <A, R>(self: Stream<A, E, R>) => Stream<A, E, R2 | R>; // overload 1
export declare const onError: <A, E, R, X, R2>(self: Stream<A, E, R>, cleanup: (cause: Cause.Cause<E>) => Effect.Effect<X, never, R2>): Stream<A, E, R | R2>; // overload 2
export declare const onExit: <E, R2>(finalizer: (exit: Exit.Exit<unknown, E>) => Effect.Effect<unknown, never, R2>): <A, R>(self: Stream<A, E, R>) => Stream<A, E, R | R2>; // overload 1
export declare const onExit: <A, E, R, R2>(self: Stream<A, E, R>, finalizer: (exit: Exit.Exit<unknown, E>) => Effect.Effect<unknown, never, R2>): Stream<A, E, R | R2>; // overload 2
export declare const onFirst: <A, X, EX, RX>(onFirst: (element: NoInfer<A>) => Effect.Effect<X, EX, RX>): <E, R>(self: Stream<A, E, R>) => Stream<A, E | EX, R | RX>; // overload 1
export declare const onFirst: <A, E, R, X, EX, RX>(self: Stream<A, E, R>, onFirst: (element: NoInfer<A>) => Effect.Effect<X, EX, RX>): Stream<A, E | EX, R | RX>; // overload 2
export declare const onStart: <X, EX, RX>(onStart: Effect.Effect<X, EX, RX>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E | EX, R | RX>; // overload 1
export declare const onStart: <A, E, R, X, EX, RX>(self: Stream<A, E, R>, onStart: Effect.Effect<X, EX, RX>): Stream<A, E | EX, R | RX>; // overload 2
export declare const orDie: <A, E, R>(self: Stream<A, E, R>): Stream<A, never, R>;
export declare const orElseIfEmpty: <E, A2, E2, R2>(orElse: LazyArg<Stream<A2, E2, R2>>): <A, R>(self: Stream<A, E, R>) => Stream<A | A2, E | E2, R | R2>; // overload 1
export declare const orElseIfEmpty: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, orElse: LazyArg<Stream<A2, E2, R2>>): Stream<A | A2, E | E2, R | R2>; // overload 2
export declare const orElseSucceed: <E, A2>(f: (error: E) => A2): <A, R>(self: Stream<A, E, R>) => Stream<A | A2, never, R>; // overload 1
export declare const orElseSucceed: <A, E, R, A2>(self: Stream<A, E, R>, f: (error: E) => A2): Stream<A | A2, never, R>; // overload 2
export declare const paginate: <S, A, E = never, R = never>(s: S, f: (s: S) => Effect.Effect<readonly [ReadonlyArray<A>, Option.Option<S>], E, R>): Stream<A, E, R>;
export declare const partition: <C extends A, B extends A, A = C>(refinement: Refinement<NoInfer<A>, B>, options?: { readonly bufferSize?: number | undefined; }): <E, R>(self: Stream<C, E, R>) => Effect.Effect<[excluded: Stream<Exclude<C, B>, E>, satisfying: Stream<B, E>], never, R | Scope.Scope>; // overload 1
export declare const partition: <A, Result extends Filter.ResultOrBool>(filter: Filter.OrPredicate<NoInfer<A>, Result>, options?: { readonly bufferSize?: number | undefined; }): <E, R>(self: Stream<A, E, R>) => Effect.Effect<[excluded: Stream<Filter.Fail<A, Result>, E>, satisfying: Stream<Filter.Pass<A, Result>, E>], never, R | Scope.Scope>; // overload 2
export declare const partition: <C extends A, E, R, B extends A, A = C>(self: Stream<C, E, R>, refinement: Refinement<A, B>, options?: { readonly bufferSize?: number | undefined; }): Effect.Effect<[excluded: Stream<Exclude<C, B>, E>, satisfying: Stream<B, E>], never, R | Scope.Scope>; // overload 3
export declare const partition: <A, E, R, Result extends Filter.ResultOrBool>(self: Stream<A, E, R>, filter: Filter.OrPredicate<NoInfer<A>, Result>, options?: { readonly bufferSize?: number | undefined; }): Effect.Effect<[excluded: Stream<Filter.Fail<A, Result>, E>, satisfying: Stream<Filter.Pass<A, Result>, E>], never, R | Scope.Scope>; // overload 4
export declare const partitionEffect: <A, B, X, EX, RX>(filter: Filter.FilterEffect<A, B, X, EX, RX>, options?: { readonly capacity?: number | "unbounded" | undefined; readonly concurrency?: number | "unbounded" | undefined; }): <E, R>(self: Stream<A, E, R>) => Effect.Effect<[passes: Stream<B, E | EX>, fails: Stream<X, E | EX>], never, R | RX | Scope.Scope>; // overload 1
export declare const partitionEffect: <A, E, R, B, X, EX, RX>(self: Stream<A, E, R>, filter: Filter.FilterEffect<A, B, X, EX, RX>, options?: { readonly capacity?: number | "unbounded" | undefined; readonly concurrency?: number | "unbounded" | undefined; }): Effect.Effect<[passes: Stream<B, E | EX>, fails: Stream<X, E | EX>], never, R | RX | Scope.Scope>; // overload 2
export declare const partitionQueue: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>, options?: { readonly capacity?: number | "unbounded" | undefined; }): <E, R>(self: Stream<A, E, R>) => Effect.Effect<[passes: Queue.Dequeue<B, E | Cause.Done>, fails: Queue.Dequeue<Exclude<A, B>, E | Cause.Done>], never, R | Scope.Scope>; // overload 1
export declare const partitionQueue: <A, Result extends Filter.ResultOrBool>(filter: Filter.OrPredicate<NoInfer<A>, Result>, options?: { readonly capacity?: number | "unbounded" | undefined; }): <E, R>(self: Stream<A, E, R>) => Effect.Effect<[passes: Queue.Dequeue<Filter.Pass<A, Result>, E | Cause.Done>, fails: Queue.Dequeue<Filter.Fail<A, Result>, E | Cause.Done>], never, R | Scope.Scope>; // overload 2
export declare const partitionQueue: <A, E, R, B extends A>(self: Stream<A, E, R>, refinement: Refinement<A, B>, options?: { readonly capacity?: number | "unbounded" | undefined; }): Effect.Effect<[passes: Queue.Dequeue<B, E | Cause.Done>, fails: Queue.Dequeue<Exclude<A, B>, E | Cause.Done>], never, R | Scope.Scope>; // overload 3
export declare const partitionQueue: <A, E, R, Result extends Filter.ResultOrBool>(self: Stream<A, E, R>, filter: Filter.OrPredicate<NoInfer<A>, Result>, options?: { readonly capacity?: number | "unbounded" | undefined; }): Effect.Effect<[passes: Queue.Dequeue<Filter.Pass<A, Result>, E | Cause.Done>, fails: Queue.Dequeue<Filter.Fail<A, Result>, E | Cause.Done>], never, R | Scope.Scope>; // overload 4
export declare const peel: <A2, A, E2, R2>(sink: Sink.Sink<A2, A, A, E2, R2>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<[A2, Stream<A, E, never>], E2 | E, Scope.Scope | R2 | R>; // overload 1
export declare const peel: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, sink: Sink.Sink<A2, A, A, E2, R2>): Effect.Effect<[A2, Stream<A, E, never>], E | E2, Scope.Scope | R | R2>; // overload 2
export declare const pipeThrough: <A2, A, L, E2, R2>(sink: Sink.Sink<A2, A, L, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<L, E2 | E, R2 | R>; // overload 1
export declare const pipeThrough: <A, E, R, A2, L, E2, R2>(self: Stream<A, E, R>, sink: Sink.Sink<A2, A, L, E2, R2>): Stream<L, E | E2, R | R2>; // overload 2
export declare const pipeThroughChannel: <R2, E, E2, A, A2>(channel: Channel.Channel<Arr.NonEmptyReadonlyArray<A2>, E2, unknown, Arr.NonEmptyReadonlyArray<A>, E, unknown, R2>): <R>(self: Stream<A, E, R>) => Stream<A2, E2, R2 | R>; // overload 1
export declare const pipeThroughChannel: <R, R2, E, E2, A, A2>(self: Stream<A, E, R>, channel: Channel.Channel<Arr.NonEmptyReadonlyArray<A2>, E2, unknown, Arr.NonEmptyReadonlyArray<A>, E, unknown, R2>): Stream<A2, E2, R | R2>; // overload 2
export declare const pipeThroughChannelOrFail: <R2, E, E2, A, A2>(channel: Channel.Channel<Arr.NonEmptyReadonlyArray<A2>, E2, unknown, Arr.NonEmptyReadonlyArray<A>, E, unknown, R2>): <R>(self: Stream<A, E, R>) => Stream<A2, E | E2, R2 | R>; // overload 1
export declare const pipeThroughChannelOrFail: <R, R2, E, E2, A, A2>(self: Stream<A, E, R>, channel: Channel.Channel<Arr.NonEmptyReadonlyArray<A2>, E2, unknown, Arr.NonEmptyReadonlyArray<A>, E, unknown, R2>): Stream<A2, E | E2, R | R2>; // overload 2
export declare const prepend: <B>(values: Iterable<B>): <A, E, R>(self: Stream<A, E, R>) => Stream<B | A, E, R>; // overload 1
export declare const prepend: <A, E, R, B>(self: Stream<A, E, R>, values: Iterable<B>): Stream<A | B, E, R>; // overload 2
export declare const provide: <AL, EL = never, RL = never>(layer: Layer.Layer<AL, EL, RL> | ServiceMap.ServiceMap<AL>, options?: { readonly local?: boolean | undefined; } | undefined): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E | EL, Exclude<R, AL> | RL>; // overload 1
export declare const provide: <A, E, R, AL, EL = never, RL = never>(self: Stream<A, E, R>, layer: Layer.Layer<AL, EL, RL> | ServiceMap.ServiceMap<AL>, options?: { readonly local?: boolean | undefined; } | undefined): Stream<A, E | EL, Exclude<R, AL> | RL>; // overload 2
export declare const provideService: <I, S>(key: ServiceMap.Service<I, S>, service: NoInfer<S>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, Exclude<R, I>>; // overload 1
export declare const provideService: <A, E, R, I, S>(self: Stream<A, E, R>, key: ServiceMap.Service<I, S>, service: NoInfer<S>): Stream<A, E, Exclude<R, I>>; // overload 2
export declare const provideServiceEffect: <I, S, ES, RS>(key: ServiceMap.Service<I, S>, service: Effect.Effect<NoInfer<S>, ES, RS>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E | ES, Exclude<R, I> | RS>; // overload 1
export declare const provideServiceEffect: <A, E, R, I, S, ES, RS>(self: Stream<A, E, R>, key: ServiceMap.Service<I, S>, service: Effect.Effect<NoInfer<S>, ES, RS>): Stream<A, E | ES, Exclude<R, I> | RS>; // overload 2
export declare const provideServices: <R2>(services: ServiceMap.ServiceMap<R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, Exclude<R, R2>>; // overload 1
export declare const provideServices: <A, E, R, R2>(self: Stream<A, E, R>, services: ServiceMap.ServiceMap<R2>): Stream<A, E, Exclude<R, R2>>; // overload 2
export declare const race: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AL | AR, EL | ER, RL | RR>; // overload 1
export declare const race: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AL | AR, EL | ER, RL | RR>; // overload 2
export declare const raceAll: <S extends ReadonlyArray<Stream<any, any, any>>>(...streams: S): Stream<Success<S[number]>, Error<S[number]>, Services<S[number]>>;
export declare const range: (min: number, max: number, chunkSize?: number): Stream<number>;
export declare const rechunk: (size: number): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const rechunk: <A, E, R>(self: Stream<A, E, R>, size: number): Stream<A, E, R>; // overload 2
export declare const repeat: <B, E2, R2>(schedule: Schedule.Schedule<B, void, E2, R2> | (($: <SO, SE, SR>(_: Schedule.Schedule<SO, void, SE, SR>) => Schedule.Schedule<SO, void, SE, SR>) => Schedule.Schedule<B, void, E2, R2>)): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E | E2, R2 | R>; // overload 1
export declare const repeat: <A, E, R, B, E2, R2>(self: Stream<A, E, R>, schedule: Schedule.Schedule<B, void, E2, R2> | (($: <SO, SE, SR>(_: Schedule.Schedule<SO, void, SE, SR>) => Schedule.Schedule<SO, void, SE, SR>) => Schedule.Schedule<B, void, E2, R2>)): Stream<A, E | E2, R | R2>; // overload 2
export declare const repeatElements: <B, E2, R2>(schedule: Schedule.Schedule<B, unknown, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E | E2, R2 | R>; // overload 1
export declare const repeatElements: <A, E, R, B, E2, R2>(self: Stream<A, E, R>, schedule: Schedule.Schedule<B, unknown, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const result: <A, E, R>(self: Stream<A, E, R>): Stream<Result.Result<A, E>, never, R>;
export declare const retry: <E, X, E2, R2>(policy: Schedule.Schedule<X, NoInfer<E>, E2, R2> | (($: <SO, SE, SR>(_: Schedule.Schedule<SO, NoInfer<E>, SE, SR>) => Schedule.Schedule<SO, E, SE, SR>) => Schedule.Schedule<X, NoInfer<E>, E2, R2>)): <A, R>(self: Stream<A, E, R>) => Stream<A, E | E2, R2 | R>; // overload 1
export declare const retry: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, policy: Schedule.Schedule<X, NoInfer<E>, E2, R2> | (($: <SO, SE, SR>(_: Schedule.Schedule<SO, NoInfer<E>, SE, SR>) => Schedule.Schedule<SO, E, SE, SR>) => Schedule.Schedule<X, NoInfer<E>, E2, R2>)): Stream<A, E | E2, R2 | R>; // overload 2
export declare const run: <A2, A, L, E2, R2>(sink: Sink.Sink<A2, A, L, E2, R2>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<A2, E2 | E, R | R2>; // overload 1
export declare const run: <A, E, R, L, A2, E2, R2>(self: Stream<A, E, R>, sink: Sink.Sink<A2, A, L, E2, R2>): Effect.Effect<A2, E | E2, R | R2>; // overload 2
export declare const runCollect: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<Array<A>, E, R>;
export declare const runCount: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<number, E, R>;
export declare const runDrain: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<void, E, R>;
export declare const runFold: <Z, A>(initial: LazyArg<Z>, f: (acc: Z, a: A) => Z): <E, R>(self: Stream<A, E, R>) => Effect.Effect<Z, E, R>; // overload 1
export declare const runFold: <A, E, R, Z>(self: Stream<A, E, R>, initial: LazyArg<Z>, f: (acc: Z, a: A) => Z): Effect.Effect<Z, E, R>; // overload 2
export declare const runFoldEffect: <Z, A, EX, RX>(initial: LazyArg<Z>, f: (acc: Z, a: A) => Effect.Effect<Z, EX, RX>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<Z, E | EX, R | RX>; // overload 1
export declare const runFoldEffect: <A, E, R, Z, EX, RX>(self: Stream<A, E, R>, initial: LazyArg<Z>, f: (acc: Z, a: A) => Effect.Effect<Z, EX, RX>): Effect.Effect<Z, E | EX, R | RX>; // overload 2
export declare const runForEach: <A, X, E2, R2>(f: (a: A) => Effect.Effect<X, E2, R2>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<void, E2 | E, R2 | R>; // overload 1
export declare const runForEach: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, f: (a: A) => Effect.Effect<X, E2, R2>): Effect.Effect<void, E | E2, R | R2>; // overload 2
export declare const runForEachArray: <A, X, E2, R2>(f: (a: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<X, E2, R2>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<void, E2 | E, R2 | R>; // overload 1
export declare const runForEachArray: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, f: (a: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<X, E2, R2>): Effect.Effect<void, E | E2, R | R2>; // overload 2
export declare const runForEachWhile: <A, E2, R2>(f: (a: A) => Effect.Effect<boolean, E2, R2>): <E, R>(self: Stream<A, E, R>) => Effect.Effect<void, E2 | E, R2 | R>; // overload 1
export declare const runForEachWhile: <A, E, R, E2, R2>(self: Stream<A, E, R>, f: (a: A) => Effect.Effect<boolean, E2, R2>): Effect.Effect<void, E | E2, R | R2>; // overload 2
export declare const runHead: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<Option.Option<A>, E, R>;
export declare const runIntoPubSub: <A>(pubsub: PubSub.PubSub<A>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Effect.Effect<void, E, R>; // overload 1
export declare const runIntoPubSub: <A, E, R>(self: Stream<A, E, R>, pubsub: PubSub.PubSub<A>, options?: { readonly shutdownOnEnd?: boolean | undefined; } | undefined): Effect.Effect<void, never, R>; // overload 2
export declare const runIntoQueue: <A, E>(queue: Queue.Queue<A, E | Cause.Done>): <R>(self: Stream<A, E, R>) => Effect.Effect<void, never, R>; // overload 1
export declare const runIntoQueue: <A, E, R>(self: Stream<A, E, R>, queue: Queue.Queue<A, E | Cause.Done>): Effect.Effect<void, never, R>; // overload 2
export declare const runLast: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<Option.Option<A>, E, R>;
export declare const runSum: <E, R>(self: Stream<number, E, R>): Effect.Effect<number, E, R>;
export declare const scan: <S, A>(initial: S, f: (s: S, a: A) => S): <E, R>(self: Stream<A, E, R>) => Stream<S, E, R>; // overload 1
export declare const scan: <A, E, R, S>(self: Stream<A, E, R>, initial: S, f: (s: S, a: A) => S): Stream<S, E, R>; // overload 2
export declare const scanEffect: <S, A, E2, R2>(initial: S, f: (s: S, a: A) => Effect.Effect<S, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<S, E | E2, R | R2>; // overload 1
export declare const scanEffect: <A, E, R, S, E2, R2>(self: Stream<A, E, R>, initial: S, f: (s: S, a: A) => Effect.Effect<S, E2, R2>): Stream<S, E | E2, R | R2>; // overload 2
export declare const schedule: <X, E2, R2, A>(schedule: Schedule.Schedule<X, NoInfer<A>, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<A, E | E2, R2 | R>; // overload 1
export declare const schedule: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, schedule: Schedule.Schedule<X, NoInfer<A>, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const scoped: <A, E, R>(self: Stream<A, E, R>): Stream<A, E, Exclude<R, Scope.Scope>>;
export declare const share: (options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; readonly idleTimeToLive?: Duration.Input | undefined; } | { readonly capacity: number; readonly strategy?: "sliding" | "dropping" | "suspend" | undefined; readonly replay?: number | undefined; readonly idleTimeToLive?: Duration.Input | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<Stream<A, E>, never, Scope.Scope | R>; // overload 1
export declare const share: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; readonly idleTimeToLive?: Duration.Input | undefined; } | { readonly capacity: number; readonly strategy?: "sliding" | "dropping" | "suspend" | undefined; readonly replay?: number | undefined; readonly idleTimeToLive?: Duration.Input | undefined; }): Effect.Effect<Stream<A, E>, never, Scope.Scope | R>; // overload 2
export declare const sliding: (chunkSize: number): <A, E, R>(self: Stream<A, E, R>) => Stream<Arr.NonEmptyReadonlyArray<A>, E, R>; // overload 1
export declare const sliding: <A, E, R>(self: Stream<A, E, R>, chunkSize: number): Stream<Arr.NonEmptyReadonlyArray<A>, E, R>; // overload 2
export declare const slidingSize: (chunkSize: number, stepSize: number): <A, E, R>(self: Stream<A, E, R>) => Stream<Arr.NonEmptyReadonlyArray<A>, E, R>; // overload 1
export declare const slidingSize: <A, E, R>(self: Stream<A, E, R>, chunkSize: number, stepSize: number): Stream<Arr.NonEmptyReadonlyArray<A>, E, R>; // overload 2
export declare const split: <A, B extends A>(refinement: Refinement<NoInfer<A>, B>): <E, R>(self: Stream<A, E, R>) => Stream<Arr.NonEmptyReadonlyArray<Exclude<A, B>>, E, R>; // overload 1
export declare const split: <A>(predicate: Predicate<NoInfer<A>>): <E, R>(self: Stream<A, E, R>) => Stream<Arr.NonEmptyReadonlyArray<A>, E, R>; // overload 2
export declare const split: <A, E, R, B extends A>(self: Stream<A, E, R>, refinement: Refinement<A, B>): Stream<Arr.NonEmptyReadonlyArray<Exclude<A, B>>, E, R>; // overload 3
export declare const split: <A, E, R>(self: Stream<A, E, R>, predicate: Predicate<A>): Stream<Arr.NonEmptyReadonlyArray<A>, E, R>; // overload 4
export declare const splitLines: <E, R>(self: Stream<string, E, R>): Stream<string, E, R>;
export declare const succeed: <A>(value: A): Stream<A>;
export declare const suspend: <A, E, R>(stream: LazyArg<Stream<A, E, R>>): Stream<A, E, R>;
export declare const switchMap: <A, A2, E2, R2>(f: (a: A) => Stream<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Stream<A2, E2 | E, R2 | R>; // overload 1
export declare const switchMap: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (a: A) => Stream<A2, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; readonly bufferSize?: number | undefined; } | undefined): Stream<A2, E | E2, R | R2>; // overload 2
export declare const sync: <A>(evaluate: LazyArg<A>): Stream<A>;
export declare const take: (n: number): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const take: <A, E, R>(self: Stream<A, E, R>, n: number): Stream<A, E, R>; // overload 2
export declare const takeRight: (n: number): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const takeRight: <A, E, R>(self: Stream<A, E, R>, n: number): Stream<A, E, R>; // overload 2
export declare const takeUntil: <A>(predicate: (a: NoInfer<A>, n: number) => boolean, options?: { readonly excludeLast?: boolean | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const takeUntil: <A, E, R>(self: Stream<A, E, R>, predicate: (a: A, n: number) => boolean, options?: { readonly excludeLast?: boolean | undefined; }): Stream<A, E, R>; // overload 2
export declare const takeUntilEffect: <A, E2, R2>(predicate: (a: NoInfer<A>, n: number) => Effect.Effect<boolean, E2, R2>, options?: { readonly excludeLast?: boolean | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const takeUntilEffect: <A, E, R, E2, R2>(self: Stream<A, E, R>, predicate: (a: A, n: number) => Effect.Effect<boolean, E2, R2>, options?: { readonly excludeLast?: boolean | undefined; }): Stream<A, E | E2, R | R2>; // overload 2
export declare const takeWhile: <A, B extends A>(refinement: (a: NoInfer<A>, n: number) => a is B): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 1
export declare const takeWhile: <A>(predicate: (a: NoInfer<A>, n: number) => boolean): <E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 2
export declare const takeWhile: <A, B, X>(f: Filter.Filter<NoInfer<A>, B, X>): <E, R>(self: Stream<A, E, R>) => Stream<B, E, R>; // overload 3
export declare const takeWhile: <A, E, R, B extends A>(self: Stream<A, E, R>, refinement: (a: NoInfer<A>, n: number) => a is B): Stream<B, E, R>; // overload 4
export declare const takeWhile: <A, E, R>(self: Stream<A, E, R>, predicate: (a: NoInfer<A>, n: number) => boolean): Stream<A, E, R>; // overload 5
export declare const takeWhile: <A, E, R, B, X>(self: Stream<A, E, R>, f: Filter.Filter<NoInfer<A>, B, X>): Stream<B, E, R>; // overload 6
export declare const takeWhileEffect: <A, E2, R2>(predicate: (a: NoInfer<A>, n: number) => Effect.Effect<boolean, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<A, E | E2, R | R2>; // overload 1
export declare const takeWhileEffect: <A, E, R, E2, R2>(self: Stream<A, E, R>, predicate: (a: NoInfer<A>, n: number) => Effect.Effect<boolean, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const tap: <A, X, E2, R2>(f: (a: NoInfer<A>) => Effect.Effect<X, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; } | undefined): <E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const tap: <A, E, R, X, E2, R2>(self: Stream<A, E, R>, f: (a: NoInfer<A>) => Effect.Effect<X, E2, R2>, options?: { readonly concurrency?: number | "unbounded" | undefined; } | undefined): Stream<A, E | E2, R | R2>; // overload 2
export declare const tapBoth: <A, E, X, E2, R2, Y, E3, R3>(options: { readonly onElement: (a: NoInfer<A>) => Effect.Effect<X, E2, R2>; readonly onError: (a: NoInfer<E>) => Effect.Effect<Y, E3, R3>; readonly concurrency?: number | "unbounded" | undefined; }): <R>(self: Stream<A, E, R>) => Stream<A, E | E2 | E3, R | R2 | R3>; // overload 1
export declare const tapBoth: <A, E, R, X, E2, R2, Y, E3, R3>(self: Stream<A, E, R>, options: { readonly onElement: (a: NoInfer<A>) => Effect.Effect<X, E2, R2>; readonly onError: (a: NoInfer<E>) => Effect.Effect<Y, E3, R3>; readonly concurrency?: number | "unbounded" | undefined; }): Stream<A, E | E2 | E3, R | R2 | R3>; // overload 2
export declare const tapCause: <E, A2, E2, R2>(f: (cause: Cause.Cause<E>) => Effect.Effect<A2, E2, R2>): <A, R>(self: Stream<A, E, R>) => Stream<A, E | E2, R2 | R>; // overload 1
export declare const tapCause: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (cause: Cause.Cause<E>) => Effect.Effect<A2, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const tapError: <E, A2, E2, R2>(f: (error: E) => Effect.Effect<A2, E2, R2>): <A, R>(self: Stream<A, E, R>) => Stream<A, E | E2, R2 | R>; // overload 1
export declare const tapError: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, f: (error: E) => Effect.Effect<A2, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const tapSink: <A, E2, R2>(sink: Sink.Sink<unknown, A, unknown, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const tapSink: <A, E, R, E2, R2>(self: Stream<A, E, R>, sink: Sink.Sink<unknown, A, unknown, E2, R2>): Stream<A, E | E2, R | R2>; // overload 2
export declare const throttle: <A>(options: { readonly cost: (arr: Arr.NonEmptyReadonlyArray<A>) => number; readonly units: number; readonly duration: Duration.Input; readonly burst?: number | undefined; readonly strategy?: "enforce" | "shape" | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const throttle: <A, E, R>(self: Stream<A, E, R>, options: { readonly cost: (arr: Arr.NonEmptyReadonlyArray<A>) => number; readonly units: number; readonly duration: Duration.Input; readonly burst?: number | undefined; readonly strategy?: "enforce" | "shape" | undefined; }): Stream<A, E, R>; // overload 2
export declare const throttleEffect: <A, E2, R2>(options: { readonly cost: (arr: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<number, E2, R2>; readonly units: number; readonly duration: Duration.Input; readonly burst?: number | undefined; readonly strategy?: "enforce" | "shape" | undefined; }): <E, R>(self: Stream<A, E, R>) => Stream<A, E2 | E, R2 | R>; // overload 1
export declare const throttleEffect: <A, E, R, E2, R2>(self: Stream<A, E, R>, options: { readonly cost: (arr: Arr.NonEmptyReadonlyArray<A>) => Effect.Effect<number, E2, R2>; readonly units: number; readonly duration: Duration.Input; readonly burst?: number | undefined; readonly strategy?: "enforce" | "shape" | undefined; }): Stream<A, E | E2, R | R2>; // overload 2
export declare const tick: (interval: Duration.Input): Stream<void>;
export declare const timeout: (duration: Duration.Input): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R>; // overload 1
export declare const timeout: <A, E, R>(self: Stream<A, E, R>, duration: Duration.Input): Stream<A, E, R>; // overload 2
export declare const toAsyncIterable: <A, E>(self: Stream<A, E>): AsyncIterable<A>;
export declare const toAsyncIterableEffect: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<AsyncIterable<A>, never, R>;
export declare const toAsyncIterableWith: <XR>(services: ServiceMap.ServiceMap<XR>): <A, E, R extends XR>(self: Stream<A, E, R>) => AsyncIterable<A>; // overload 1
export declare const toAsyncIterableWith: <A, E, XR, R extends XR>(self: Stream<A, E, R>, services: ServiceMap.ServiceMap<XR>): AsyncIterable<A>; // overload 2
export declare const toChannel: <A, E, R>(stream: Stream<A, E, R>): Channel.Channel<Arr.NonEmptyReadonlyArray<A>, E, void, unknown, unknown, unknown, R>;
export declare const toPubSub: (options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<PubSub.PubSub<A>, never, R | Scope.Scope>; // overload 1
export declare const toPubSub: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; readonly shutdownOnEnd?: boolean | undefined; }): Effect.Effect<PubSub.PubSub<A>, never, R | Scope.Scope>; // overload 2
export declare const toPubSubTake: (options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<PubSub.PubSub<Take.Take<A, E>>, never, R | Scope.Scope>; // overload 1
export declare const toPubSubTake: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; readonly replay?: number | undefined; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; readonly replay?: number | undefined; }): Effect.Effect<PubSub.PubSub<Take.Take<A, E>>, never, R | Scope.Scope>; // overload 2
export declare const toPull: <A, E, R>(self: Stream<A, E, R>): Effect.Effect<Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E>, never, R | Scope.Scope>;
export declare const toQueue: (options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): <A, E, R>(self: Stream<A, E, R>) => Effect.Effect<Queue.Dequeue<A, E | Cause.Done>, never, R | Scope.Scope>; // overload 1
export declare const toQueue: <A, E, R>(self: Stream<A, E, R>, options: { readonly capacity: "unbounded"; } | { readonly capacity: number; readonly strategy?: "dropping" | "sliding" | "suspend" | undefined; }): Effect.Effect<PubSub.PubSub<A>, never, R | Scope.Scope>; // overload 2
export declare const toReadableStream: <A>(options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): <E>(self: Stream<A, E>) => ReadableStream<A>; // overload 1
export declare const toReadableStream: <A, E>(self: Stream<A, E>, options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): ReadableStream<A>; // overload 2
export declare const toReadableStreamEffect: <A>(options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): <E, R>(self: Stream<A, E, R>) => Effect.Effect<ReadableStream<A>, never, R>; // overload 1
export declare const toReadableStreamEffect: <A, E, R>(self: Stream<A, E, R>, options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): Effect.Effect<ReadableStream<A>, never, R>; // overload 2
export declare const toReadableStreamWith: <A, XR>(services: ServiceMap.ServiceMap<XR>, options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): <E, R extends XR>(self: Stream<A, E, R>) => ReadableStream<A>; // overload 1
export declare const toReadableStreamWith: <A, E, XR, R extends XR>(self: Stream<A, E, R>, services: ServiceMap.ServiceMap<XR>, options?: { readonly strategy?: QueuingStrategy<A> | undefined; }): ReadableStream<A>; // overload 2
export declare const transduce: <A2, A, E2, R2>(sink: Sink.Sink<A2, A, A, E2, R2>): <E, R>(self: Stream<A, E, R>) => Stream<A2, E2 | E, R2 | R>; // overload 1
export declare const transduce: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, sink: Sink.Sink<A2, A, A, E2, R2>): Stream<A2, E2 | E, R2 | R>; // overload 2
export declare const transformPull: <A, E, R, B, E2, R2, EX, RX>(self: Stream<A, E, R>, f: (pull: Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void>, scope: Scope.Scope) => Effect.Effect<Pull.Pull<Arr.NonEmptyReadonlyArray<B>, E2, void, R2>, EX, RX>): Stream<B, EX | Pull.ExcludeDone<E2>, R | R2 | RX>;
export declare const transformPullBracket: <A, E, R, B, E2, R2, EX, RX>(self: Stream<A, E, R>, f: (pull: Pull.Pull<Arr.NonEmptyReadonlyArray<A>, E, void, R>, scope: Scope.Scope, forkedScope: Scope.Scope) => Effect.Effect<Pull.Pull<Arr.NonEmptyReadonlyArray<B>, E2, void, R2>, EX, RX>): Stream<B, EX | Pull.ExcludeDone<E2>, R | R2 | RX>;
export declare const unfold: <S, A, E, R>(s: S, f: (s: S) => Effect.Effect<readonly [A, S] | undefined, E, R>): Stream<A, E, R>;
export declare const unwrap: <A, E2, R2, E, R>(effect: Effect.Effect<Stream<A, E2, R2>, E, R>): Stream<A, E | E2, R2 | Exclude<R, Scope.Scope>>;
export declare const updateService: <I, S>(key: ServiceMap.Service<I, S>, f: (service: NoInfer<S>) => S): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, R | I>; // overload 1
export declare const updateService: <A, E, R, I, S>(self: Stream<A, E, R>, key: ServiceMap.Service<I, S>, f: (service: NoInfer<S>) => S): Stream<A, E, R | I>; // overload 2
export declare const updateServices: <R, R2>(f: (services: ServiceMap.ServiceMap<R2>) => ServiceMap.ServiceMap<R>): <A, E>(self: Stream<A, E, R>) => Stream<A, E, R2>; // overload 1
export declare const updateServices: <A, E, R, R2>(self: Stream<A, E, R>, f: (services: ServiceMap.ServiceMap<R2>) => ServiceMap.ServiceMap<R>): Stream<A, E, R2>; // overload 2
export declare const when: <EX = never, RX = never>(test: Effect.Effect<boolean, EX, RX>): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E | EX, R | RX>; // overload 1
export declare const when: <A, E, R, EX = never, RX = never>(self: Stream<A, E, R>, test: Effect.Effect<boolean, EX, RX>): Stream<A, E | EX, R | RX>; // overload 2
export declare const withExecutionPlan: <Input, R2, Provides, PolicyE>(policy: ExecutionPlan.ExecutionPlan<{ provides: Provides; input: Input; error: PolicyE; requirements: R2; }>, options?: { readonly preventFallbackOnPartialStream?: boolean | undefined; }): <A, E extends Input, R>(self: Stream<A, E, R>) => Stream<A, E | PolicyE, R2 | Exclude<R, Provides>>; // overload 1
export declare const withExecutionPlan: <A, E extends Input, R, R2, Input, Provides, PolicyE>(self: Stream<A, E, R>, policy: ExecutionPlan.ExecutionPlan<{ provides: Provides; input: Input; error: PolicyE; requirements: R2; }>, options?: { readonly preventFallbackOnPartialStream?: boolean | undefined; }): Stream<A, E | PolicyE, R2 | Exclude<R, Provides>>; // overload 2
export declare const withSpan: (name: string, options?: SpanOptions): <A, E, R>(self: Stream<A, E, R>) => Stream<A, E, Exclude<R, ParentSpan>>; // overload 1
export declare const withSpan: <A, E, R>(self: Stream<A, E, R>, name: string, options?: SpanOptions): Stream<A, E, Exclude<R, ParentSpan>>; // overload 2
export declare const zip: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A, E, R>(self: Stream<A, E, R>) => Stream<[A, A2], E2 | E, R2 | R>; // overload 1
export declare const zip: <A, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<[A, A2], E | E2, R | R2>; // overload 2
export declare const zipFlatten: <A2, E2, R2>(that: Stream<A2, E2, R2>): <A extends ReadonlyArray<any>, E, R>(self: Stream<A, E, R>) => Stream<[...A, A2], E2 | E, R2 | R>; // overload 1
export declare const zipFlatten: <A extends ReadonlyArray<any>, E, R, A2, E2, R2>(self: Stream<A, E, R>, that: Stream<A2, E2, R2>): Stream<[...A, A2], E | E2, R | R2>; // overload 2
export declare const zipLatest: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<[AL, AR], EL | ER, RL | RR>; // overload 1
export declare const zipLatest: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<[AL, AR], EL | ER, RL | RR>; // overload 2
export declare const zipLatestAll: <T extends ReadonlyArray<Stream<any, any, any>>>(...streams: T): Stream<[T[number]] extends [never] ? never : { [K in keyof T]: T[K] extends Stream<infer A, infer _E, infer _R> ? A : never; }, [T[number]] extends [never] ? never : T[number] extends Stream<infer _A, infer _E, infer _R> ? _E : never, [T[number]] extends [never] ? never : T[number] extends Stream<infer _A, infer _E, infer _R> ? _R : never>;
export declare const zipLatestWith: <AR, ER, RR, AL, A>(right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): <EL, RL>(left: Stream<AL, EL, RL>) => Stream<A, EL | ER, RL | RR>; // overload 1
export declare const zipLatestWith: <AL, EL, RL, AR, ER, RR, A>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): Stream<A, EL | ER, RL | RR>; // overload 2
export declare const zipLeft: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AL, ER | EL, RR | RL>; // overload 1
export declare const zipLeft: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AL, EL | ER, RL | RR>; // overload 2
export declare const zipRight: <AR, ER, RR>(right: Stream<AR, ER, RR>): <AL, EL, RL>(left: Stream<AL, EL, RL>) => Stream<AR, ER | EL, RR | RL>; // overload 1
export declare const zipRight: <AL, EL, RL, AR, ER, RR>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>): Stream<AR, EL | ER, RL | RR>; // overload 2
export declare const zipWith: <AR, ER, RR, AL, A>(right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): <EL, RL>(left: Stream<AL, EL, RL>) => Stream<A, EL | ER, RL | RR>; // overload 1
export declare const zipWith: <AL, EL, RL, AR, ER, RR, A>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>, f: (left: AL, right: AR) => A): Stream<A, EL | ER, RL | RR>; // overload 2
export declare const zipWithArray: <AR, ER, RR, AL, A>(right: Stream<AR, ER, RR>, f: (left: Arr.NonEmptyReadonlyArray<AL>, right: Arr.NonEmptyReadonlyArray<AR>) => readonly [output: Arr.NonEmptyReadonlyArray<A>, leftoverLeft: ReadonlyArray<AL>, leftoverRight: ReadonlyArray<AR>]): <EL, RL>(left: Stream<AL, EL, RL>) => Stream<A, EL | ER, RL | RR>; // overload 1
export declare const zipWithArray: <AL, EL, RL, AR, ER, RR, A>(left: Stream<AL, EL, RL>, right: Stream<AR, ER, RR>, f: (left: Arr.NonEmptyReadonlyArray<AL>, right: Arr.NonEmptyReadonlyArray<AR>) => readonly [output: Arr.NonEmptyReadonlyArray<A>, leftoverLeft: ReadonlyArray<AL>, leftoverRight: ReadonlyArray<AR>]): Stream<A, EL | ER, RL | RR>; // overload 2
export declare const zipWithIndex: <A, E, R>(self: Stream<A, E, R>): Stream<[A, number], E, R>;
export declare const zipWithNext: <A, E, R>(self: Stream<A, E, R>): Stream<[A, Option.Option<A>], E, R>;
export declare const zipWithPrevious: <A, E, R>(self: Stream<A, E, R>): Stream<[Option.Option<A>, A], E, R>;
export declare const zipWithPreviousAndNext: <A, E, R>(self: Stream<A, E, R>): Stream<[Option.Option<A>, A, Option.Option<A>], E, R>;
```

## Other Exports (Non-Function)

- `DefaultChunkSize` (variable)
- `Do` (variable)
- `empty` (variable)
- `Error` (type)
- `EventListener` (interface)
- `HaltStrategy` (type)
- `never` (variable)
- `Services` (type)
- `Stream` (interface)
- `StreamTypeLambda` (interface)
- `StreamUnify` (interface)
- `StreamUnifyIgnore` (interface)
- `Success` (type)
- `Variance` (interface)
- `VarianceStruct` (interface)
