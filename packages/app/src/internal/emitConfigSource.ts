import type { VirtualModuleBuildError } from "@typed/virtual-modules";

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

export function emitConfigSource(
  config: Readonly<Record<string, unknown>>,
  pluginName: string,
): string | VirtualModuleBuildError {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(config)) {
    if (!isValidExportName(key)) return invalidConfigKey(key, pluginName);
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return unserializableConfigKey(key, pluginName);
    lines.push(`export const ${key} = ${serialized};`);
  }
  return lines.join("\n");
}

function isValidExportName(name: string): boolean {
  return IDENTIFIER_PATTERN.test(name) && !RESERVED_WORDS.has(name);
}

function invalidConfigKey(key: string, pluginName: string): VirtualModuleBuildError {
  return {
    errors: [
      {
        code: "TVM-CONFIG-004",
        message: `typed:config cannot export invalid config key ${JSON.stringify(key)}`,
        pluginName,
      },
    ],
  };
}

function unserializableConfigKey(key: string, pluginName: string): VirtualModuleBuildError {
  return {
    errors: [
      {
        code: "TVM-CONFIG-002",
        message: `typed:config cannot serialize config key ${JSON.stringify(key)}`,
        pluginName,
      },
    ],
  };
}
