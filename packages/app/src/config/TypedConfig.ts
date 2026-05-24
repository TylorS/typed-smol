/**
 * Canonical configuration type for typed-smol projects.
 * All fields are optional — sane defaults apply everywhere.
 */

/** Options for vite-plugin-compression when compression is enabled. */
export type TypedCompressionOptions =
  | boolean
  | {
      readonly algorithm?: "gzip" | "brotliCompress" | "deflate" | "deflateRaw";
      readonly ext?: string;
      readonly threshold?: number;
      readonly [key: string]: unknown;
    };

export interface TypedTestConfig {
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
  readonly globals?: boolean;
  readonly environment?: string;
  readonly typecheck?: boolean | { readonly enabled?: boolean };
  readonly coverage?: {
    readonly provider?: "v8" | "istanbul";
    readonly include?: readonly string[];
    readonly exclude?: readonly string[];
    readonly reporter?: readonly string[];
    readonly thresholds?: {
      readonly lines?: number;
      readonly branches?: number;
      readonly functions?: number;
      readonly statements?: number;
    };
  };
  readonly reporters?: readonly string[];
}

export interface TypedLintConfig {
  readonly rules?: Readonly<Record<string, "off" | "warn" | "error">>;
  readonly categories?: Readonly<Record<string, "off" | "warn" | "error">>;
  readonly plugins?: readonly string[];
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
  readonly fix?: boolean;
}

export interface TypedFormatConfig {
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
  readonly printWidth?: number;
  readonly tabWidth?: number;
  readonly useTabs?: boolean;
  readonly semi?: boolean;
  readonly singleQuote?: boolean;
  readonly trailingComma?: "all" | "es5" | "none";
  readonly bracketSpacing?: boolean;
  readonly arrowParens?: "always" | "avoid";
}

export interface TypedDevtoolsConfig {
  readonly enabled?: boolean;
  readonly sessionId?: string;
}

export type TypedTemplateDiagnosticMode = "error" | "warn" | "silent";
export type TypedBrowserMode = "mount" | "mpa";

export interface TypedOpenApiConfig {
  readonly annotations?: Readonly<Record<string, unknown>>;
  readonly generation?: {
    readonly additionalProperties?: boolean;
  };
  readonly exposure?: {
    readonly jsonPath?: `/${string}` | false;
    readonly swaggerPath?: `/${string}` | false;
    readonly scalar?:
      | false
      | {
          readonly path?: `/${string}`;
          readonly source?: "inline" | "cdn";
          readonly version?: string;
          readonly config?: Readonly<Record<string, unknown>>;
        };
  };
}

export interface TypedConfig {
  /** Server entry file path. Default: "server.ts" */
  readonly entry?: string;

  /** Router virtual module plugin options. */
  readonly router?: {
    readonly prefix?: string;
    readonly routes?: readonly string[];
  };

  /** HttpApi virtual module plugin options. */
  readonly api?: {
    readonly prefix?: string;
    readonly pathPrefix?: `/${string}`;
  };

  /** Direct template compiler defaults. Target is selected by the host compiler context. */
  readonly templates?: boolean | { readonly diagnostics?: TypedTemplateDiagnosticMode };

  /** HTML shell virtual module defaults for short typed:html imports. */
  readonly html?: {
    readonly path?: string;
    readonly outlet?: string;
  };

  /** Browser runtime virtual module defaults for short typed:browser imports. */
  readonly browser?: {
    readonly routes?: readonly string[];
    readonly root?: string;
    readonly base?: string;
    readonly mode?: TypedBrowserMode;
    readonly name?: string;
  };

  /** Storybook runtime virtual module defaults. */
  readonly storybook?: {
    readonly routes?: readonly string[];
    readonly api?: readonly string[];
    readonly proxyPath?: string;
    readonly serverOrigin?: string;
  };

  /** Global OpenAPI defaults. Source-file OpenAPI conventions override these values. */
  readonly openapi?: TypedOpenApiConfig;

  /** Path to tsconfig.json (relative to project root or absolute). Default: auto-discovered. */
  readonly tsconfig?: string;

  /** Enable Vite-native tsconfig path alias resolution. Default: true. */
  readonly tsconfigPaths?: boolean;

  /** Dev server defaults. Overridden by CLI flags. */
  readonly server?: {
    readonly host?: string;
    readonly port?: number;
    readonly open?: boolean;
    readonly cors?: boolean;
    readonly strictPort?: boolean;
  };

  /** Build defaults. Overridden by CLI flags. */
  readonly build?: {
    readonly outDir?: string;
    readonly clientOutDir?: string;
    readonly serverOutDir?: string;
    readonly target?: string;
    readonly sourcemap?: boolean;
    readonly minify?: boolean;
  };

  /** Preview server defaults. Overridden by CLI flags. */
  readonly preview?: {
    readonly host?: string;
    readonly port?: number;
    readonly strictPort?: boolean;
    readonly open?: boolean;
  };

  /** Vitest test runner defaults. Overridden by CLI flags. */
  readonly test?: TypedTestConfig;

  /** Oxlint linter defaults. Overridden by CLI flags. */
  readonly lint?: TypedLintConfig;

  /** Oxfmt formatter defaults. Overridden by CLI flags. */
  readonly format?: TypedFormatConfig;

  /** Bundle analyzer toggle/options. Default: false. */
  readonly analyze?:
    | boolean
    | { readonly filename?: string; readonly open?: boolean; readonly template?: string };

  /** DevTools instrumentation opt-in. Default: false. */
  readonly devtools?: boolean | TypedDevtoolsConfig;

  /** Brotli compression for builds. Default: true. */
  readonly compression?: TypedCompressionOptions;

  /** Warn on virtual module resolution errors. Default: true. */
  readonly warnOnError?: boolean;
}
