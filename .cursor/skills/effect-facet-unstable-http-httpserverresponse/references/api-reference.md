# API Reference: effect/unstable/http/HttpServerResponse

- Import path: `effect/unstable/http/HttpServerResponse`
- Source file: `packages/effect/src/unstable/http/HttpServerResponse.ts`
- Function exports (callable): 30
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `empty`
- `file`
- `fileWeb`
- `formData`
- `fromWeb`
- `html`
- `htmlStream`
- `isHttpServerResponse`
- `json`
- `jsonUnsafe`
- `mergeCookies`
- `raw`
- `redirect`
- `removeCookie`
- `replaceCookies`
- `schemaJson`
- `setBody`
- `setCookie`

## All Function Signatures

```ts
export declare const empty: (options?: Options.WithContent | undefined): HttpServerResponse;
export declare const file: (path: string, options?: (Options & { readonly bytesToRead?: FileSystem.SizeInput | undefined; readonly chunkSize?: FileSystem.SizeInput | undefined; readonly offset?: FileSystem.SizeInput | undefined; }) | undefined): Effect.Effect<HttpServerResponse, PlatformError, HttpPlatform>;
export declare const fileWeb: (file: Body.HttpBody.FileLike, options?: (Options.WithContent & { readonly bytesToRead?: FileSystem.SizeInput | undefined; readonly chunkSize?: FileSystem.SizeInput | undefined; readonly offset?: FileSystem.SizeInput | undefined; }) | undefined): Effect.Effect<HttpServerResponse, never, HttpPlatform>;
export declare const formData: (body: FormData, options?: Options.WithContent | undefined): HttpServerResponse;
export declare const fromWeb: (response: Response): HttpServerResponse;
export declare const html: <A extends ReadonlyArray<Template.Interpolated>>(strings: TemplateStringsArray, ...args: A): Effect.Effect<HttpServerResponse, Template.Interpolated.Error<A[number]>, Template.Interpolated.Context<A[number]>>; // overload 1
export declare const html: (html: string): HttpServerResponse; // overload 2
export declare const htmlStream: <A extends ReadonlyArray<Template.InterpolatedWithStream>>(strings: TemplateStringsArray, ...args: A): Effect.Effect<HttpServerResponse, never, Template.Interpolated.Context<A[number]>>;
export declare const isHttpServerResponse: (u: unknown): u is HttpServerResponse;
export declare const json: (body: unknown, options?: Options.WithContentType | undefined): Effect.Effect<HttpServerResponse, Body.HttpBodyError>;
export declare const jsonUnsafe: (body: unknown, options?: Options.WithContentType | undefined): HttpServerResponse;
export declare const mergeCookies: (cookies: Cookies.Cookies): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const mergeCookies: (self: HttpServerResponse, cookies: Cookies.Cookies): HttpServerResponse; // overload 2
export declare const raw: (body: unknown, options?: Options | undefined): HttpServerResponse;
export declare const redirect: (location: string | URL, options?: Options.WithContent | undefined): HttpServerResponse;
export declare const removeCookie: (name: string): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const removeCookie: (self: HttpServerResponse, name: string): HttpServerResponse; // overload 2
export declare const replaceCookies: (cookies: Cookies.Cookies): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const replaceCookies: (self: HttpServerResponse, cookies: Cookies.Cookies): HttpServerResponse; // overload 2
export declare const schemaJson: <A, I, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): (body: A, options?: Options.WithContentType | undefined) => Effect.Effect<HttpServerResponse, Body.HttpBodyError, RE>;
export declare const setBody: (body: Body.HttpBody): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const setBody: (self: HttpServerResponse, body: Body.HttpBody): HttpServerResponse; // overload 2
export declare const setCookie: (name: string, value: string, options?: Cookies.Cookie["options"]): (self: HttpServerResponse) => Effect.Effect<HttpServerResponse, Cookies.CookiesError>; // overload 1
export declare const setCookie: (self: HttpServerResponse, name: string, value: string, options?: Cookies.Cookie["options"]): Effect.Effect<HttpServerResponse, Cookies.CookiesError>; // overload 2
export declare const setCookies: (cookies: Iterable<readonly [name: string, value: string, options?: Cookies.Cookie["options"]]>): (self: HttpServerResponse) => Effect.Effect<HttpServerResponse, Cookies.CookiesError, never>; // overload 1
export declare const setCookies: (self: HttpServerResponse, cookies: Iterable<readonly [name: string, value: string, options?: Cookies.Cookie["options"]]>): Effect.Effect<HttpServerResponse, Cookies.CookiesError, never>; // overload 2
export declare const setCookiesUnsafe: (cookies: Iterable<readonly [name: string, value: string, options?: Cookies.Cookie["options"]]>): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const setCookiesUnsafe: (self: HttpServerResponse, cookies: Iterable<readonly [name: string, value: string, options?: Cookies.Cookie["options"]]>): HttpServerResponse; // overload 2
export declare const setCookieUnsafe: (name: string, value: string, options?: Cookies.Cookie["options"]): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const setCookieUnsafe: (self: HttpServerResponse, name: string, value: string, options?: Cookies.Cookie["options"]): HttpServerResponse; // overload 2
export declare const setHeader: (key: string, value: string): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const setHeader: (self: HttpServerResponse, key: string, value: string): HttpServerResponse; // overload 2
export declare const setHeaders: (input: Headers.Input): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const setHeaders: (self: HttpServerResponse, input: Headers.Input): HttpServerResponse; // overload 2
export declare const setStatus: (status: number, statusText?: string | undefined): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const setStatus: (self: HttpServerResponse, status: number, statusText?: string | undefined): HttpServerResponse; // overload 2
export declare const stream: <E>(body: Stream.Stream<Uint8Array, E>, options?: Options | undefined): HttpServerResponse;
export declare const text: (body: string, options?: Options.WithContentType): HttpServerResponse;
export declare const toWeb: (response: HttpServerResponse, options?: { readonly withoutBody?: boolean | undefined; readonly services?: ServiceMap.ServiceMap<never> | undefined; }): Response;
export declare const uint8Array: (body: Uint8Array, options?: Options.WithContentType): HttpServerResponse;
export declare const updateCookies: (f: (cookies: Cookies.Cookies) => Cookies.Cookies): (self: HttpServerResponse) => HttpServerResponse; // overload 1
export declare const updateCookies: (self: HttpServerResponse, f: (cookies: Cookies.Cookies) => Cookies.Cookies): HttpServerResponse; // overload 2
export declare const urlParams: (body: UrlParams.Input, options?: Options.WithContentType | undefined): HttpServerResponse;
```

## Other Exports (Non-Function)

- `HttpServerResponse` (interface)
- `Options` (interface)
