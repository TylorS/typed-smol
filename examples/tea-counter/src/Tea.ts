import { Fx, RefSubject, Subject } from "@typed/fx";
import { RenderEvent } from "@typed/template";
import { Effect } from "effect";

export type Cmd<Msg, E = never, R = never> = Fx.Fx<Msg, E, R>;
export type Sub<Msg, E = never, R = never> = Fx.Fx<Msg, E, R>;

export type Dispatch<Msg> = (msg: Msg) => Effect.Effect<void>;

const proxy = RefSubject.proxy;

export type State<Model extends Record<any, any>, E = never, R = never> = ReturnType<
  typeof proxy<Model, E, R>
>;

export const program = Fx.fn(function* <
  Model extends Record<any, any>,
  Msg,
  E = never,
  R = never,
  E2 = never,
  R2 = never,
  E3 = never,
  R3 = never,
  E4 = never,
  R4 = never,
>(
  [initialModel, initialCmd]: readonly [Model, Cmd<Msg, E, R>],
  update: (msg: Msg, model: Model) => readonly [Model, Cmd<Msg, E2, R2>],
  view: (
    model: ReturnType<typeof proxy<Model, E | E2 | E3 | E4, never>>,
  ) => (dispatch: Dispatch<Msg>) => Fx.Fx<RenderEvent | null, E3, R3>,
  subs: (model: Model) => Sub<Msg, E4, R4> = () => Fx.never,
) {
  const model = yield* RefSubject.make<Model, E | E2 | E3 | E4>(Effect.succeed(initialModel));
  const msgs = yield* Subject.make<Msg>();
  const dispatch = Effect.fn('dispatch')(msgs.onSuccess)
  const subscriptions = model.pipe(
    Fx.map(subs),
    Fx.switchMapEffect((sub) =>
      sub.run({
        onSuccess: dispatch,
        onFailure: model.onFailure,
      }),
    ),
  );
  const commands = Fx.mergeAll(initialCmd, msgs).pipe(
    Fx.tap((msg) => {
      return RefSubject.modify(model, (s) => {
        const [x, y] = update(msg, s);
        return [y, x];
      }).pipe(
        Effect.flatMap((cmd) =>
          cmd.run({
            onSuccess: dispatch,
            onFailure: model.onFailure,
          }),
        ),
      );
    }),
  );

  yield* Fx.mergeAll(commands, subscriptions).pipe(Fx.drain, Effect.forkScoped);

  return view(RefSubject.proxy(model) as any)(dispatch);
});
