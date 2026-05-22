import { describe, expectTypeOf, it } from "vitest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { composeWithLayers } from "./internal/appLayerTypes.js";

class Auth extends Context.Service<Auth, { readonly token: string }>()("test/Auth") {}
class Repository extends Context.Service<Repository, { readonly find: () => string }>()(
  "test/Repository",
) {}
class Account extends Context.Service<Account, { readonly current: Effect.Effect<string> }>()(
  "test/Account",
) {}
class Profile extends Context.Service<Profile, { readonly username: Effect.Effect<string> }>()(
  "test/Profile",
) {}
class Page extends Context.Service<Page, { readonly load: Effect.Effect<string> }>()("test/Page") {}

describe("app layer types", () => {
  it("keeps provided layer requirements out of launched programs", () => {
    const base = Layer.effectDiscard(Effect.flatMap(Auth, () => Effect.void));
    const auth = Layer.succeed(Auth)({ token: "test-token" });
    const layer = composeWithLayers(base, [auth]);
    const program = Effect.provide(Layer.launch(layer), Context.empty());

    expectTypeOf(program).toExtend<Effect.Effect<never, never, never>>();
  });

  it("keeps provider requirements composable across a dependency chain", () => {
    const base = Layer.effectDiscard(Effect.flatMap(Account, (account) => account.current));
    const account = Layer.effect(
      Account,
      Effect.map(Repository, (repository) => ({ current: Effect.sync(repository.find) })),
    );
    const repository = Layer.succeed(Repository)({ find: () => "typed" });
    const layer = composeWithLayers(base, [account, repository]);

    expectTypeOf(Layer.launch(layer)).toExtend<Effect.Effect<never, never, never>>();
  });

  it("keeps services provided by merged provider layers available to the base layer", () => {
    const base = Layer.effectDiscard(
      Effect.zip(
        Effect.flatMap(Account, (account) => account.current),
        Effect.flatMap(Profile, (profile) => profile.username),
      ),
    );
    const account = Layer.effect(
      Account,
      Effect.map(Repository, (repository) => ({ current: Effect.sync(repository.find) })),
    );
    const profile = Layer.effect(
      Profile,
      Effect.map(Repository, (repository) => ({ username: Effect.sync(repository.find) })),
    );
    const services = Layer.mergeAll(account, profile);
    const repository = Layer.succeed(Repository)({ find: () => "typed" });
    const layer = composeWithLayers(base, [services, repository]);

    expectTypeOf(Layer.launch(layer)).toExtend<Effect.Effect<never, never, never>>();
  });

  it("keeps services available when a companion layer adds requirements satisfied later", () => {
    const base = Layer.effectDiscard(
      Effect.all([
        Effect.flatMap(Account, (account) => account.current),
        Effect.flatMap(Profile, (profile) => profile.username),
        Effect.flatMap(Page, (page) => page.load),
      ]),
    );
    const page = Layer.effect(
      Page,
      Effect.map(Account, (account) => ({ load: account.current })),
    );
    const account = Layer.effect(
      Account,
      Effect.map(Repository, (repository) => ({ current: Effect.sync(repository.find) })),
    );
    const profile = Layer.effect(
      Profile,
      Effect.map(Repository, (repository) => ({ username: Effect.sync(repository.find) })),
    );
    const services = Layer.mergeAll(account, profile);
    const repository = Layer.succeed(Repository)({ find: () => "typed" });
    const layer = composeWithLayers(base, [page, services, repository]);

    expectTypeOf(Layer.launch(layer)).toExtend<Effect.Effect<never, never, never>>();
  });
});
