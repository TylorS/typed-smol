export interface TypedDevtoolsManifestOptions {
  readonly description?: string;
  readonly devtoolsPage?: string;
  readonly name?: string;
  readonly version?: string;
}

export interface TypedDevtoolsManifest {
  readonly description: string;
  readonly devtools_page: string;
  readonly manifest_version: 3;
  readonly name: string;
  readonly version: string;
}

export function makeTypedDevtoolsManifest(
  options: TypedDevtoolsManifestOptions = {},
): TypedDevtoolsManifest {
  return {
    description: options.description ?? "Typed framework DevTools",
    devtools_page: options.devtoolsPage ?? "devtools.html",
    manifest_version: 3,
    name: options.name ?? "Typed DevTools",
    version: options.version ?? "1.0.0-beta.4",
  };
}
