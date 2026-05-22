import { resolve } from "node:path";
import { Context, Layer } from "effect";

export const packageRoot = resolve(process.cwd());
export const defaultDataDirectory = resolve(packageRoot, ".data");
export const defaultDatabasePath = resolve(defaultDataDirectory, "realworld.sqlite");

export interface RealWorldConfigService {
  readonly databasePath: string;
}

export class RealWorldConfig extends Context.Service<
  RealWorldConfig,
  RealWorldConfigService
>()("@typed/realworld/RealWorldConfig") {
  static readonly make = (
    overrides: Partial<RealWorldConfigService> = {},
  ): RealWorldConfigService => ({
    databasePath: overrides.databasePath ?? defaultDatabasePath,
  });

  static readonly layer = (
    overrides: Partial<RealWorldConfigService> = {},
  ): Layer.Layer<RealWorldConfig> => Layer.sync(RealWorldConfig, () => this.make(overrides));

  static readonly Live = this.layer();
}
