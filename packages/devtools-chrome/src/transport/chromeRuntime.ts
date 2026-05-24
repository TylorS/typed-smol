import type { TypedDevtoolsRpc, TypedDevtoolsRpcTag } from "@typed/devtools-protocol";
import type * as Rpc from "effect/unstable/rpc/Rpc";

export const TYPED_DEVTOOLS_CHROME_PORT = "typed-devtools:rpc";
export const TYPED_DEVTOOLS_CHROME_PROTOCOL = "typed-devtools";

type TypedRpcFor<Tag extends TypedDevtoolsRpcTag> = Extract<
  TypedDevtoolsRpc,
  { readonly _tag: Tag }
>;

export type ChromeRuntimeRpcPayload<Tag extends TypedDevtoolsRpcTag> = Rpc.Payload<
  TypedRpcFor<Tag>
>;

export type ChromeRuntimeRpcSuccess<Tag extends TypedDevtoolsRpcTag> = Rpc.Success<
  TypedRpcFor<Tag>
>;

export interface ChromeRuntimeRpcRequest<Tag extends TypedDevtoolsRpcTag = TypedDevtoolsRpcTag> {
  readonly id: number;
  readonly payload: ChromeRuntimeRpcPayload<Tag>;
  readonly protocol: typeof TYPED_DEVTOOLS_CHROME_PROTOCOL;
  readonly tag: Tag;
}

export interface ChromeRuntimeRpcSuccessResponse<
  Tag extends TypedDevtoolsRpcTag = TypedDevtoolsRpcTag,
> {
  readonly id: number;
  readonly protocol: typeof TYPED_DEVTOOLS_CHROME_PROTOCOL;
  readonly success: ChromeRuntimeRpcSuccess<Tag>;
  readonly tag: Tag;
}

export interface ChromeRuntimeRpcFailureResponse {
  readonly error: unknown;
  readonly id: number;
  readonly protocol: typeof TYPED_DEVTOOLS_CHROME_PROTOCOL;
  readonly tag: TypedDevtoolsRpcTag;
}

export type ChromeRuntimeRpcResponse<Tag extends TypedDevtoolsRpcTag = TypedDevtoolsRpcTag> =
  | ChromeRuntimeRpcFailureResponse
  | ChromeRuntimeRpcSuccessResponse<Tag>;

export interface ChromeRuntimeConnectable {
  readonly connect: (options?: { readonly name?: string }) => ChromeRuntimePort;
}

export interface ChromeRuntimePort {
  readonly disconnect: () => void;
  readonly onDisconnect: ChromeRuntimeEvent<[]>;
  readonly onMessage: ChromeRuntimeEvent<[unknown]>;
  readonly postMessage: (message: unknown) => void;
}

export interface ChromeRuntimeEvent<Args extends readonly unknown[]> {
  readonly addListener: (listener: (...args: Args) => void) => void;
  readonly removeListener?: (listener: (...args: Args) => void) => void;
}

export interface ChromeRuntimeRpcClient {
  readonly disconnect: () => void;
  readonly request: <Tag extends TypedDevtoolsRpcTag>(
    tag: Tag,
    payload: ChromeRuntimeRpcPayload<Tag>,
  ) => Promise<ChromeRuntimeRpcSuccess<Tag>>;
}

export function makeChromeRuntimeRpcClient(
  runtime: ChromeRuntimeConnectable,
  options: { readonly portName?: string } = {},
): ChromeRuntimeRpcClient {
  const port = runtime.connect({ name: options.portName ?? TYPED_DEVTOOLS_CHROME_PORT });
  let nextId = 1;
  const pending = new Map<
    number,
    {
      readonly reject: (reason: unknown) => void;
      readonly resolve: (value: unknown) => void;
      readonly tag: TypedDevtoolsRpcTag;
    }
  >();
  const onMessage = (message: unknown) => handleResponse(pending, message);
  const onDisconnect = () => rejectPending(pending, new Error("Chrome runtime port disconnected"));

  port.onMessage.addListener(onMessage);
  port.onDisconnect.addListener(onDisconnect);

  return {
    disconnect: () => {
      port.onMessage.removeListener?.(onMessage);
      port.onDisconnect.removeListener?.(onDisconnect);
      rejectPending(pending, new Error("Chrome runtime port disconnected"));
      port.disconnect();
    },
    request: (tag, payload) => {
      const id = nextId++;
      const request = {
        id,
        payload,
        protocol: TYPED_DEVTOOLS_CHROME_PROTOCOL,
        tag,
      } satisfies ChromeRuntimeRpcRequest<typeof tag>;
      const response = new Promise<ChromeRuntimeRpcSuccess<typeof tag>>((resolve, reject) => {
        pending.set(id, { reject, resolve: resolve as (value: unknown) => void, tag });
      });
      port.postMessage(request);
      return response;
    },
  };
}

function handleResponse(
  pending: Map<
    number,
    {
      readonly reject: (reason: unknown) => void;
      readonly resolve: (value: unknown) => void;
      readonly tag: TypedDevtoolsRpcTag;
    }
  >,
  message: unknown,
): void {
  if (!isChromeRuntimeRpcResponse(message)) return;
  const deferred = pending.get(message.id);
  if (!deferred) return;
  if (message.tag !== deferred.tag) return;
  if (!isCompleteChromeRuntimeRpcResponse(message)) return;
  pending.delete(message.id);
  if ("error" in message) {
    deferred.reject(message.error);
    return;
  }
  deferred.resolve(message.success);
}

function rejectPending(
  pending: Map<number, { readonly reject: (reason: unknown) => void }>,
  reason: unknown,
): void {
  for (const deferred of pending.values()) {
    deferred.reject(reason);
  }
  pending.clear();
}

function isChromeRuntimeRpcResponse(message: unknown): message is ChromeRuntimeRpcResponse {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<ChromeRuntimeRpcResponse>;
  return (
    candidate.protocol === TYPED_DEVTOOLS_CHROME_PROTOCOL &&
    typeof candidate.id === "number" &&
    typeof candidate.tag === "string"
  );
}

function isCompleteChromeRuntimeRpcResponse(response: ChromeRuntimeRpcResponse): boolean {
  return "success" in response !== "error" in response;
}
