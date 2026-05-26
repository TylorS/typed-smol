import {
  requestsExport,
  type VirtualModuleBuildContext,
  type VirtualModuleBuildError,
} from "@typed/virtual-modules";

const RESERVED_WORDS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function emitEnvSource(
  env: Readonly<Record<string, string | undefined>>,
  pluginName: string,
  context?: VirtualModuleBuildContext,
): string | VirtualModuleBuildError {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (!requestsExport(context, key)) continue;
    if (!isValidExportName(key)) return invalidEnvKey(key, pluginName);
    lines.push(`export const ${key} = ${JSON.stringify(value)};`);
  }
  if (context?.requestedExports.kind === "names" && lines.length === 0) return "export {};";
  return lines.join("\n");
}

function isValidExportName(name: string): boolean {
  return IDENTIFIER_PATTERN.test(name) && !RESERVED_WORDS.has(name);
}

function invalidEnvKey(key: string, pluginName: string): VirtualModuleBuildError {
  return {
    errors: [
      {
        code: "TVM-ENV-001",
        message: `typed:env cannot export invalid environment key ${JSON.stringify(key)}`,
        pluginName,
      },
    ],
  };
}
