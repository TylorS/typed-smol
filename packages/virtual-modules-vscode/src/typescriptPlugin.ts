import type * as vscode from "vscode";

export const TYPED_TYPESCRIPT_PLUGIN_NAME = "@typed/virtual-modules-ts-plugin";
const TYPESCRIPT_EXTENSION_ID = "vscode.typescript-language-features";

export interface TypeScriptPluginConfiguration {
  readonly templateDiagnostics: boolean;
  readonly routeDiagnostics: boolean;
}

interface TypeScriptExtensionApi {
  configurePlugin(pluginName: string, configuration: TypeScriptPluginConfiguration): void;
}

interface TypeScriptExtensionExports {
  getAPI(version: 0): TypeScriptExtensionApi | undefined;
}

export function createTypeScriptPluginConfiguration(
  input: Partial<TypeScriptPluginConfiguration> = {},
): TypeScriptPluginConfiguration {
  return {
    routeDiagnostics: input.routeDiagnostics ?? true,
    templateDiagnostics: input.templateDiagnostics ?? true,
  };
}

export async function configureTypeScriptPlugin(
  vscodeApi: Pick<typeof vscode, "extensions">,
  configuration: TypeScriptPluginConfiguration = createTypeScriptPluginConfiguration(),
): Promise<boolean> {
  const extension = vscodeApi.extensions.getExtension<TypeScriptExtensionExports>(
    TYPESCRIPT_EXTENSION_ID,
  );
  if (!extension) return false;
  await extension.activate();
  const api = extension.exports.getAPI(0);
  if (!api) return false;
  api.configurePlugin(TYPED_TYPESCRIPT_PLUGIN_NAME, configuration);
  return true;
}
