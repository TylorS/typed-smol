# API Reference: effect/unstable/http/Cookies

- Import path: `effect/unstable/http/Cookies`
- Source file: `packages/effect/src/unstable/http/Cookies.ts`
- Function exports (callable): 23
- Non-function exports: 8

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `fromIterable`
- `fromReadonlyRecord`
- `fromSetCookie`
- `get`
- `getValue`
- `isCookie`
- `isCookies`
- `isEmpty`
- `makeCookie`
- `makeCookieUnsafe`
- `merge`
- `parseHeader`
- `remove`
- `serializeCookie`
- `set`
- `setAll`
- `setAllCookie`
- `setAllUnsafe`

## All Function Signatures

```ts
export declare const fromIterable: (cookies: Iterable<Cookie>): Cookies;
export declare const fromReadonlyRecord: (cookies: Record.ReadonlyRecord<string, Cookie>): Cookies;
export declare const fromSetCookie: (headers: Iterable<string> | string): Cookies;
export declare const get: (name: string): (self: Cookies) => Cookie | undefined; // overload 1
export declare const get: (self: Cookies, name: string): Cookie | undefined; // overload 2
export declare const getValue: (name: string): (self: Cookies) => string | undefined; // overload 1
export declare const getValue: (self: Cookies, name: string): string | undefined; // overload 2
export declare const isCookie: (u: unknown): u is Cookie;
export declare const isCookies: (u: unknown): u is Cookies;
export declare const isEmpty: (self: Cookies): boolean;
export declare const makeCookie: (name: string, value: string, options?: Cookie["options"] | undefined): Result.Result<Cookie, CookiesError>;
export declare const makeCookieUnsafe: (name: string, value: string, options?: Cookie["options"] | undefined): Cookie;
export declare const merge: (that: Cookies): (self: Cookies) => Cookies; // overload 1
export declare const merge: (self: Cookies, that: Cookies): Cookies; // overload 2
export declare const parseHeader: (header: string): Record<string, string>;
export declare const remove: (name: string): (self: Cookies) => Cookies; // overload 1
export declare const remove: (self: Cookies, name: string): Cookies; // overload 2
export declare const serializeCookie: (self: Cookie): string;
export declare const set: (name: string, value: string, options?: Cookie["options"]): (self: Cookies) => Result.Result<Cookies, CookiesError>; // overload 1
export declare const set: (self: Cookies, name: string, value: string, options?: Cookie["options"]): Result.Result<Cookies, CookiesError>; // overload 2
export declare const setAll: (cookies: Iterable<readonly [name: string, value: string, options?: Cookie["options"]]>): (self: Cookies) => Result.Result<Cookies, CookiesError>; // overload 1
export declare const setAll: (self: Cookies, cookies: Iterable<readonly [name: string, value: string, options?: Cookie["options"]]>): Result.Result<Cookies, CookiesError>; // overload 2
export declare const setAllCookie: (cookies: Iterable<Cookie>): (self: Cookies) => Cookies; // overload 1
export declare const setAllCookie: (self: Cookies, cookies: Iterable<Cookie>): Cookies; // overload 2
export declare const setAllUnsafe: (cookies: Iterable<readonly [name: string, value: string, options?: Cookie["options"]]>): (self: Cookies) => Cookies; // overload 1
export declare const setAllUnsafe: (self: Cookies, cookies: Iterable<readonly [name: string, value: string, options?: Cookie["options"]]>): Cookies; // overload 2
export declare const setCookie: (cookie: Cookie): (self: Cookies) => Cookies; // overload 1
export declare const setCookie: (self: Cookies, cookie: Cookie): Cookies; // overload 2
export declare const setUnsafe: (name: string, value: string, options?: Cookie["options"]): (self: Cookies) => Cookies; // overload 1
export declare const setUnsafe: (self: Cookies, name: string, value: string, options?: Cookie["options"]): Cookies; // overload 2
export declare const toCookieHeader: (self: Cookies): string;
export declare const toRecord: (self: Cookies): Record<string, string>;
export declare const toSetCookieHeaders: (self: Cookies): Array<string>;
```

## Other Exports (Non-Function)

- `Cookie` (interface)
- `Cookies` (interface)
- `CookieSchema` (interface)
- `CookiesError` (class)
- `CookiesErrorReason` (class)
- `CookiesSchema` (interface)
- `empty` (variable)
- `schemaRecord` (variable)
