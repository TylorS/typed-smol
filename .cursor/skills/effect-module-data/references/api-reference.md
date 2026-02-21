# API Reference: effect/Data

- Import path: `effect/Data`
- Source file: `packages/effect/src/Data.ts`
- Function exports (callable): 3
- Non-function exports: 3

## Purpose

This module provides utilities for creating data types with structural equality semantics. Unlike regular JavaScript objects, `Data` types support value-based equality comparison using the `Equal` module.

## Key Function Exports

- `TaggedClass`
- `taggedEnum`
- `TaggedError`

## All Function Signatures

```ts
export declare const TaggedClass: <Tag extends string>(tag: Tag): new <A extends Record<string, any> = {}>(args: Types.Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Readonly<A> & { readonly _tag: Tag; } & Pipeable.Pipeable;
export declare const taggedEnum: <Z extends TaggedEnum.WithGenerics<1>>(): Types.Simplify<{ readonly [Tag in Z["taggedEnum"]["_tag"]]: <A>(args: TaggedEnum.Args<TaggedEnum.Kind<Z, A>, Tag, Extract<TaggedEnum.Kind<Z, A>, { readonly _tag: Tag; }>>) => TaggedEnum.Value<TaggedEnum.Kind<Z, A>, Tag>; } & TaggedEnum.GenericMatchers<Z>>; // overload 1
export declare const taggedEnum: <Z extends TaggedEnum.WithGenerics<2>>(): Types.Simplify<{ readonly [Tag in Z["taggedEnum"]["_tag"]]: <A, B>(args: TaggedEnum.Args<TaggedEnum.Kind<Z, A, B>, Tag, Extract<TaggedEnum.Kind<Z, A, B>, { readonly _tag: Tag; }>>) => TaggedEnum.Value<TaggedEnum.Kind<Z, A, B>, Tag>; } & TaggedEnum.GenericMatchers<Z>>; // overload 2
export declare const taggedEnum: <Z extends TaggedEnum.WithGenerics<3>>(): Types.Simplify<{ readonly [Tag in Z["taggedEnum"]["_tag"]]: <A, B, C>(args: TaggedEnum.Args<TaggedEnum.Kind<Z, A, B, C>, Tag, Extract<TaggedEnum.Kind<Z, A, B, C>, { readonly _tag: Tag; }>>) => TaggedEnum.Value<TaggedEnum.Kind<Z, A, B, C>, Tag>; } & TaggedEnum.GenericMatchers<Z>>; // overload 3
export declare const taggedEnum: <Z extends TaggedEnum.WithGenerics<4>>(): Types.Simplify<{ readonly [Tag in Z["taggedEnum"]["_tag"]]: <A, B, C, D>(args: TaggedEnum.Args<TaggedEnum.Kind<Z, A, B, C, D>, Tag, Extract<TaggedEnum.Kind<Z, A, B, C, D>, { readonly _tag: Tag; }>>) => TaggedEnum.Value<TaggedEnum.Kind<Z, A, B, C, D>, Tag>; } & TaggedEnum.GenericMatchers<Z>>; // overload 4
export declare const taggedEnum: <A extends { readonly _tag: string; }>(): TaggedEnum.Constructor<A>; // overload 5
export declare const TaggedError: <Tag extends string>(tag: Tag): new <A extends Record<string, any> = {}>(args: Types.Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => Cause.YieldableError & { readonly _tag: Tag; } & Readonly<A>;
```

## Other Exports (Non-Function)

- `Class` (variable)
- `Error` (variable)
- `TaggedEnum` (type)
