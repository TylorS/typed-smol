import { sanitizeErrorMessage } from "./internal/sanitize.js";
import { validateNonEmptyString } from "./internal/validation.js";
import type {
  ResolveVirtualModuleOptions,
  TypeInfoApi,
  TypeInfoApiSession,
  VirtualModuleDiagnostic,
  VirtualModulePlugin,
  VirtualModuleResolution,
  VirtualModuleResolver,
} from "./types.js";

const emptyTypeInfoApi: TypeInfoApi = {
  file: () => {
    throw new Error("TypeInfoApi is not configured for this resolver context");
  },
  directory: () => {
    throw new Error("TypeInfoApi is not configured for this resolver context");
  },
};

const emptySession: TypeInfoApiSession = {
  api: emptyTypeInfoApi,
  consumeDependencies: () => [],
};

const toMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const createDiagnostic = (
  code: VirtualModuleDiagnostic["code"],
  pluginName: string,
  message: string,
): VirtualModuleDiagnostic => ({
  code,
  pluginName,
  message,
});

export class PluginManager implements VirtualModuleResolver {
  readonly #plugins: VirtualModulePlugin[];

  constructor(plugins: readonly VirtualModulePlugin[] = []) {
    this.#plugins = [...plugins];
  }

  get plugins(): readonly VirtualModulePlugin[] {
    return this.#plugins;
  }

  register(plugin: VirtualModulePlugin): void {
    this.#plugins.push(plugin);
  }

  registerMany(plugins: readonly VirtualModulePlugin[]): void {
    for (const plugin of plugins) {
      this.register(plugin);
    }
  }

  resolveModule(options: ResolveVirtualModuleOptions): VirtualModuleResolution {
    const idResult = validateNonEmptyString(options.id, "options.id");
    if (!idResult.ok) {
      return { status: "error", diagnostic: createDiagnostic("invalid-options", "", idResult.reason) };
    }
    const importerResult = validateNonEmptyString(options.importer, "options.importer");
    if (!importerResult.ok) {
      return { status: "error", diagnostic: createDiagnostic("invalid-options", "", importerResult.reason) };
    }

    const createSession = options.createTypeInfoApiSession;

    for (const plugin of this.#plugins) {
      const nameResult = validateNonEmptyString(plugin.name, "Plugin name");
      if (!nameResult.ok) {
        return { status: "error", diagnostic: createDiagnostic("invalid-options", "", nameResult.reason) };
      }
      const shouldResolve = this.#safeShouldResolve(plugin, options.id, options.importer);

      if (shouldResolve.status === "error") {
        return shouldResolve;
      }

      if (!shouldResolve.value) {
        continue;
      }

      let session: TypeInfoApiSession;
      try {
        session = createSession?.({ id: options.id, importer: options.importer }) ?? emptySession;
      } catch (error) {
        return {
          status: "error",
          diagnostic: createDiagnostic(
            "session-creation-failed",
            plugin.name,
            `Session creation failed: ${sanitizeErrorMessage(toMessage(error))}`,
          ),
        };
      }

      try {
        const sourceText = plugin.build(options.id, options.importer, session.api);

        if (typeof sourceText !== "string") {
          return {
            status: "error",
            diagnostic: createDiagnostic(
              "invalid-build-output",
              plugin.name,
              `Plugin "${plugin.name}" returned a non-string build result`,
            ),
          };
        }

        return {
          status: "resolved",
          pluginName: plugin.name,
          sourceText,
          dependencies: session.consumeDependencies(),
        };
      } catch (error) {
        return {
          status: "error",
          diagnostic: createDiagnostic(
            "plugin-build-threw",
            plugin.name,
            `Plugin "${plugin.name}" build failed: ${sanitizeErrorMessage(toMessage(error))}`,
          ),
        };
      }
    }

    return { status: "unresolved" };
  }

  #safeShouldResolve(
    plugin: VirtualModulePlugin,
    id: string,
    importer: string,
  ): { status: "ok"; value: boolean } | { status: "error"; diagnostic: VirtualModuleDiagnostic } {
    try {
      return {
        status: "ok",
        value: plugin.shouldResolve(id, importer),
      };
    } catch (error) {
      return {
        status: "error",
        diagnostic: createDiagnostic(
          "plugin-should-resolve-threw",
          plugin.name,
          `Plugin "${plugin.name}" shouldResolve failed: ${sanitizeErrorMessage(toMessage(error))}`,
        ),
      };
    }
  }
}
