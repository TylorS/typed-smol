import { DevtoolsRuntime } from "@typed/devtools-runtime";
import * as Effect from "effect/Effect";
import { describe, expect, expectTypeOf, it } from "vitest";
import { defineConfig } from "./config/defineConfig.js";
import {
  devtoolsLayerFromConfig,
  resolveDevtoolsConfig,
  type ResolvedTypedDevtoolsConfig,
} from "./runtime/devtools.js";

describe("typed devtools config", () => {
  it("keeps instrumentation disabled by default", async () => {
    const resolved = resolveDevtoolsConfig({});
    const runtime = await Effect.runPromise(
      Effect.flatMap(DevtoolsRuntime, (service) => Effect.succeed(service)).pipe(
        Effect.provide(devtoolsLayerFromConfig({})),
      ),
    );

    expect(resolved).toEqual({ enabled: false });
    expect({
      enabled: runtime.enabled,
      sessionId: runtime.sessionId,
      snapshot: runtime.snapshot(),
    }).toEqual({
      enabled: false,
      sessionId: undefined,
      snapshot: [],
    });
  });

  it("enables runtime instrumentation from typed config", async () => {
    const config = defineConfig({
      devtools: {
        enabled: true,
        sessionId: "local-session",
      },
    });
    const runtime = await Effect.runPromise(
      Effect.flatMap(DevtoolsRuntime, (service) => Effect.succeed(service)).pipe(
        Effect.provide(devtoolsLayerFromConfig(config)),
      ),
    );

    expect(resolveDevtoolsConfig(config)).toEqual({
      enabled: true,
      sessionId: "session:local-session",
    });
    expect(runtime.enabled).toBe(true);
    expect(runtime.sessionId).toBe("session:local-session");
  });

  it("preserves config inference for boolean and object forms", () => {
    const disabled = defineConfig({ devtools: false });
    const enabled = defineConfig({ devtools: true });

    expect(resolveDevtoolsConfig(disabled)).toEqual({ enabled: false });
    expect(resolveDevtoolsConfig(enabled)).toEqual({ enabled: true });
    expectTypeOf(resolveDevtoolsConfig(enabled)).toExtend<ResolvedTypedDevtoolsConfig>();
  });

  it("ignores object-form session ids until instrumentation is enabled", () => {
    expect(resolveDevtoolsConfig({ devtools: { sessionId: "inactive" } })).toEqual({
      enabled: false,
    });
  });
});
