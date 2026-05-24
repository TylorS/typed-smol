import * as Schema from "effect/Schema";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import {
  DevtoolsHandshakeRequestSchema,
  DevtoolsHandshakeResponseSchema,
  DomBindingRequestSchema,
  DomBindingResolutionSchema,
  RuntimeEventStreamItemSchema,
  RuntimeEventSubscriptionRequestSchema,
  SourceAnalyzerRequestSchema,
  SourceAnalyzerResponseSchema,
} from "./Schemas.js";

export const DevtoolsRpcErrorSchema = Schema.Struct({
  _tag: Schema.Literal("DevtoolsRpcError"),
  code: Schema.Union([
    Schema.Literal("invalid-payload"),
    Schema.Literal("bridge-unavailable"),
    Schema.Literal("unsupported-capability"),
    Schema.Literal("internal-error"),
  ]),
  message: Schema.String,
});
export type DevtoolsRpcError = typeof DevtoolsRpcErrorSchema.Type;

export const HandshakeRpc = Rpc.make("Handshake", {
  payload: DevtoolsHandshakeRequestSchema,
  success: DevtoolsHandshakeResponseSchema,
  error: DevtoolsRpcErrorSchema,
});

export const SubscribeRuntimeEventsRpc = Rpc.make("SubscribeRuntimeEvents", {
  payload: RuntimeEventSubscriptionRequestSchema,
  success: RuntimeEventStreamItemSchema,
  error: DevtoolsRpcErrorSchema,
  stream: true,
});

export const ResolveDomBindingRpc = Rpc.make("ResolveDomBinding", {
  payload: DomBindingRequestSchema,
  success: DomBindingResolutionSchema,
  error: DevtoolsRpcErrorSchema,
});

export const AnalyzeSourceRpc = Rpc.make("AnalyzeSource", {
  payload: SourceAnalyzerRequestSchema,
  success: SourceAnalyzerResponseSchema,
  error: DevtoolsRpcErrorSchema,
});

export const TypedDevtoolsRpcGroup = RpcGroup.make(
  HandshakeRpc,
  SubscribeRuntimeEventsRpc,
  ResolveDomBindingRpc,
  AnalyzeSourceRpc,
);

export type TypedDevtoolsRpc = RpcGroup.Rpcs<typeof TypedDevtoolsRpcGroup>;
export type TypedDevtoolsRpcTag = Rpc.Tag<TypedDevtoolsRpc>;
