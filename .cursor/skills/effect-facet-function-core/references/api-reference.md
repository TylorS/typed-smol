# API Reference: effect/Function#core

- Import path: `effect/Function#core`
- Source file: `packages/effect/src/Function.ts`
- Thematic facet: `core`
- Function exports (callable): 21
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `absurd`
- `apply`
- `coerceUnsafe`
- `compose`
- `constant`
- `constFalse`
- `constNull`
- `constTrue`
- `constUndefined`
- `constVoid`
- `dual`
- `flip`
- `flow`
- `hole`
- `identity`
- `memoize`
- `pipe`
- `satisfies`

## All Function Signatures

```ts
export declare const absurd: <A>(_: never): A;
export declare const apply: <A>(a: A): <B>(self: (a: A) => B) => B;
export declare const coerceUnsafe: <A, B>(a: A): B;
export declare const compose: <B, C>(bc: (b: B) => C): <A>(self: (a: A) => B) => (a: A) => C; // overload 1
export declare const compose: <A, B, C>(self: (a: A) => B, bc: (b: B) => C): (a: A) => C; // overload 2
export declare const constant: <A>(value: A): LazyArg<A>;
export declare const constFalse: (): boolean;
export declare const constNull: (): null;
export declare const constTrue: (): boolean;
export declare const constUndefined: (): undefined;
export declare const constVoid: (): void;
export declare const dual: <DataLast extends (...args: Array<any>) => any, DataFirst extends (...args: Array<any>) => any>(arity: Parameters<DataFirst>["length"], body: DataFirst): DataLast & DataFirst; // overload 1
export declare const dual: <DataLast extends (...args: Array<any>) => any, DataFirst extends (...args: Array<any>) => any>(isDataFirst: (args: IArguments) => boolean, body: DataFirst): DataLast & DataFirst; // overload 2
export declare const flip: <A extends Array<unknown>, B extends Array<unknown>, C>(f: (...a: A) => (...b: B) => C): (...b: B) => (...a: A) => C;
export declare const flow: <A extends ReadonlyArray<unknown>, B = never>(ab: (...a: A) => B): (...a: A) => B; // overload 1
export declare const flow: <A extends ReadonlyArray<unknown>, B = never, C = never>(ab: (...a: A) => B, bc: (b: B) => C): (...a: A) => C; // overload 2
export declare const flow: <A extends ReadonlyArray<unknown>, B = never, C = never, D = never>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D): (...a: A) => D; // overload 3
export declare const flow: <A extends ReadonlyArray<unknown>, B = never, C = never, D = never, E = never>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E): (...a: A) => E; // overload 4
export declare const flow: <A extends ReadonlyArray<unknown>, B = never, C = never, D = never, E = never, F = never>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F): (...a: A) => F; // overload 5
export declare const flow: <A extends ReadonlyArray<unknown>, B = never, C = never, D = never, E = never, F = never, G = never>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G): (...a: A) => G; // overload 6
export declare const flow: <A extends ReadonlyArray<unknown>, B = never, C = never, D = never, E = never, F = never, G = never, H = never>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H): (...a: A) => H; // overload 7
export declare const flow: <A extends ReadonlyArray<unknown>, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I): (...a: A) => I; // overload 8
export declare const flow: <A extends ReadonlyArray<unknown>, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J): (...a: A) => J; // overload 9
export declare const hole: <T>(): T;
export declare const identity: <A>(a: A): A;
export declare const memoize: <A extends object, O>(f: (a: A) => O): (ast: A) => O;
export declare const pipe: <A>(a: A): A; // overload 1
export declare const pipe: <A, B = never>(a: A, ab: (a: A) => B): B; // overload 2
export declare const pipe: <A, B = never, C = never>(a: A, ab: (a: A) => B, bc: (b: B) => C): C; // overload 3
export declare const pipe: <A, B = never, C = never, D = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D; // overload 4
export declare const pipe: <A, B = never, C = never, D = never, E = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E): E; // overload 5
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F): F; // overload 6
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G): G; // overload 7
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H): H; // overload 8
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I): I; // overload 9
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J): J; // overload 10
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K): K; // overload 11
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never, L = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L): L; // overload 12
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never, L = never, M = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M): M; // overload 13
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never, L = never, M = never, N = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M, mn: (m: M) => N): N; // overload 14
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never, L = never, M = never, N = never, O = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M, mn: (m: M) => N, no: (n: N) => O): O; // overload 15
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never, L = never, M = never, N = never, O = never, P = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M, mn: (m: M) => N, no: (n: N) => O, op: (o: O) => P): P; // overload 16
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never, L = never, M = never, N = never, O = never, P = never, Q = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M, mn: (m: M) => N, no: (n: N) => O, op: (o: O) => P, pq: (p: P) => Q): Q; // overload 17
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never, L = never, M = never, N = never, O = never, P = never, Q = never, R = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M, mn: (m: M) => N, no: (n: N) => O, op: (o: O) => P, pq: (p: P) => Q, qr: (q: Q) => R): R; // overload 18
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never, L = never, M = never, N = never, O = never, P = never, Q = never, R = never, S = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M, mn: (m: M) => N, no: (n: N) => O, op: (o: O) => P, pq: (p: P) => Q, qr: (q: Q) => R, rs: (r: R) => S): S; // overload 19
export declare const pipe: <A, B = never, C = never, D = never, E = never, F = never, G = never, H = never, I = never, J = never, K = never, L = never, M = never, N = never, O = never, P = never, Q = never, R = never, S = never, T = never>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G, gh: (g: G) => H, hi: (h: H) => I, ij: (i: I) => J, jk: (j: J) => K, kl: (k: K) => L, lm: (l: L) => M, mn: (m: M) => N, no: (n: N) => O, op: (o: O) => P, pq: (p: P) => Q, qr: (q: Q) => R, rs: (r: R) => S, st: (s: S) => T): T; // overload 20
export declare const satisfies: <A>(): <B extends A>(b: B) => B;
export declare const SK: <A, B>(_: A, b: B): B;
export declare const tupled: <A extends ReadonlyArray<unknown>, B>(f: (...a: A) => B): (a: A) => B;
export declare const untupled: <A extends ReadonlyArray<unknown>, B>(f: (a: A) => B): (...a: A) => B;
```

## Other Exports (Non-Function)

- `FunctionN` (type)
- `FunctionTypeLambda` (interface)
- `LazyArg` (type)
