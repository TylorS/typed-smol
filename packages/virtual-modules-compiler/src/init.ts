import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VMC_CONFIG_FILENAME = "vmc.config.ts";

const INITIAL_VMC_CONFIG = `export default {
  plugins: [
    {
      name: "example",
      shouldResolve: (id) => id.startsWith("virtual:"),
      build: (id) => {
        // Return generated TypeScript source for the virtual module
        const name = id.replace("virtual:", "");
        return \`export type \${name} = { value: string };\`;
      },
    },
  ],
};
`;

export interface InitOptions {
  readonly projectRoot: string;
  readonly force?: boolean;
}

export interface InitResult {
  readonly ok: boolean;
  readonly path: string;
  readonly message: string;
}

export function runInit(options: InitOptions): InitResult {
  const { projectRoot, force = false } = options;
  const configPath = join(projectRoot, VMC_CONFIG_FILENAME);

  if (existsSync(configPath) && !force) {
    return {
      ok: false,
      path: configPath,
      message: `vmc.config.ts already exists at ${configPath}. Use --force to overwrite.`,
    };
  }

  writeFileSync(configPath, INITIAL_VMC_CONFIG.trim() + "\n", "utf8");
  return {
    ok: true,
    path: configPath,
    message: `Created ${configPath}`,
  };
}
