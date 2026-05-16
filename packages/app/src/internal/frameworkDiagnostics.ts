export const TYPED_FRAMEWORK_VIRTUAL_MODULE_PLUGIN_NAME = "typed-framework-virtual-module";

export interface FrameworkVirtualModuleDiagnostic {
  readonly code: string;
  readonly message: string;
  readonly pluginName: string;
}

export function createFrameworkDiagnostic(
  code: string,
  message: string,
): FrameworkVirtualModuleDiagnostic {
  return {
    code,
    message,
    pluginName: TYPED_FRAMEWORK_VIRTUAL_MODULE_PLUGIN_NAME,
  };
}
