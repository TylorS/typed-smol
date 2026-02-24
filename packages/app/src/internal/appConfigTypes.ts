import type * as Config from "effect/Config";

/** Config for App (sync). disableListenLog matches HttpRouter.serve option. Use raw values. */
export type AppConfig = {
  readonly disableListenLog?: boolean;
};

/** Config for run(). Extends AppConfig; host/port may be raw or Config (yield* Config.*). Supply ConfigProvider.layer when using Config. */
export type RunConfig = AppConfig & {
  readonly host?: string | Config.Config<string>;
  readonly port?: number | Config.Config<number>;
};
