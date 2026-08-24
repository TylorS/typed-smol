import type { EventHandler, Renderable } from "@typed/template";
import { chainEvent, isEventKey } from "./Events.js";
import { composeRefs, type ComposedRef } from "./Refs.js";
import type {
  EventHandlerInput,
  EventHandlerProperty,
  EventOf,
  InternalPropsHelpers,
  NonNullish,
  Property,
} from "./Types.js";

type ObjectValue<Value> = Value extends object ? Value : Record<never, never>;
type PropsRef<Props> = Property<Props, "ref">;
type MergedEventKeys<User, Internal> = Extract<
  keyof ObjectValue<User> | keyof ObjectValue<Internal>,
  EventHandlerProperty
>;
type MergedEvents<User, Internal> = {
  readonly [Key in MergedEventKeys<User, Internal>]?: EventHandler.EventHandler<
    EventOf<Property<User, Key> | Property<Internal, Key>>,
    Renderable.Error<Property<User, Key> | Property<Internal, Key>>,
    Renderable.Services<Property<User, Key> | Property<Internal, Key>>
  >;
};

export type MergedHostProps<User, Internal> = Omit<
  ObjectValue<User>,
  keyof ObjectValue<Internal> | EventHandlerProperty | "ref"
> &
  Omit<ObjectValue<Internal>, EventHandlerProperty | "ref"> &
  MergedEvents<User, Internal> & {
    readonly ref?: ComposedRef<PropsRef<Internal>, PropsRef<User>>;
  };

export type ForwardedHostKeys<Options> = Extract<
  keyof ObjectValue<Options>,
  EventHandlerProperty | "ref"
>;
export type ForwardedHostProps<Options> = Pick<ObjectValue<Options>, ForwardedHostKeys<Options>>;
export type HostOptionProps<Options> = MergedHostProps<
  Property<Options, "props">,
  ForwardedHostProps<Options>
>;

export type RenderHostProps<Options, Internal> = MergedHostProps<
  HostOptionProps<Options>,
  Internal
>;

export function mergeProps<const User extends object | undefined, const Internal extends object>(
  user: User,
  internal: Internal,
): MergedHostProps<User, Internal> {
  if (!user) return internal as MergedHostProps<User, Internal>;
  const merged = { ...user, ...internal };
  const internalRecord = internal as unknown as Record<string, unknown>;
  const mergedRecord = merged as unknown as Record<string, unknown>;

  for (const [key, value] of Object.entries(user)) {
    if (isEventKey(key)) {
      mergedRecord[key] = chainEvent(
        value as EventHandlerInput<Event>,
        internalRecord[key] as EventHandlerInput<Event>,
      );
    }
  }

  mergedRecord["ref"] = composeRefs(
    internalRecord["ref"] as ((element: never) => unknown) | undefined,
    (user as Record<string, unknown>)["ref"] as ((element: never) => unknown) | undefined,
  );
  return merged as MergedHostProps<User, Internal>;
}

export function getProperty<const Value, const Key extends PropertyKey>(
  value: Value,
  key: Key,
): Property<Value, Key> {
  return (
    value === null || value === undefined ? undefined : Reflect.get(Object(value), key)
  ) as Property<Value, Key>;
}

export function makeInternalPropsHelpers<const Options>(
  options: Options,
): InternalPropsHelpers<Options> {
  return {
    property: (key, fallback) => {
      const value = getProperty(options, key);
      return (value === null || value === undefined ? fallback : value) as
        | NonNullish<Property<Options, typeof key>>
        | typeof fallback;
    },
  };
}

export function forwardHostProps<const Options extends object>(
  options: Options,
): ForwardedHostProps<Options> {
  const props: Record<PropertyKey, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (key === "ref" || isEventKey(key)) props[key] = value;
  }
  return props as ForwardedHostProps<Options>;
}
