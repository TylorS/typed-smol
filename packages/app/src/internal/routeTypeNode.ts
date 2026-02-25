import type {
  ConstructorTypeNode,
  FunctionTypeNode,
  OverloadSetTypeNode,
  TypeInfoApi,
  TypeNode,
} from "@typed/virtual-modules";

/** True when the node represents a callable (function, overload set, or constructor). */
export function isCallableNode(
  node: TypeNode,
): node is FunctionTypeNode | OverloadSetTypeNode | ConstructorTypeNode {
  return node.kind === "function" || node.kind === "overloadSet" || node.kind === "constructor";
}

/** First signature's parameters for function-like nodes; undefined otherwise. */
function getCallableParameters(
  node: TypeNode,
): readonly { name: string; optional: boolean; type: unknown }[] | undefined {
  if (node.kind === "function") return (node as FunctionTypeNode).parameters;
  if (node.kind === "overloadSet") {
    const sigs = (node as OverloadSetTypeNode).signatures;
    return sigs[0]?.parameters;
  }
  if (node.kind === "constructor") return (node as ConstructorTypeNode).parameters;
  return undefined;
}

/** First signature's return type for function-like nodes; undefined otherwise. */
export function getCallableReturnType(node: TypeNode): TypeNode | undefined {
  if (node.kind === "function") return (node as FunctionTypeNode).returnType;
  if (node.kind === "overloadSet") {
    const sigs = (node as OverloadSetTypeNode).signatures;
    return sigs[0]?.returnType;
  }
  if (node.kind === "constructor") return (node as ConstructorTypeNode).returnType;
  return undefined;
}

/**
 * True iff the type is structurally assignable to Route.
 */
export function typeNodeIsRouteCompatible(node: TypeNode, api: TypeInfoApi): boolean {
  return api.isAssignableTo(node, "Route");
}

export type RuntimeKind = "fx" | "effect" | "stream" | "plain" | "unknown";

/**
 * Structurally determines runtime kind via api.isAssignableTo. No fallbacks.
 * Never returns "unknown"; use callers' failWhenNoTargetsResolved for that.
 */
export function typeNodeToRuntimeKind(node: TypeNode, api: TypeInfoApi): RuntimeKind {
  if (api.isAssignableTo(node, "Fx")) return "fx";
  if (api.isAssignableTo(node, "Effect")) return "effect";
  if (api.isAssignableTo(node, "Stream")) return "stream";
  return "plain";
}

/** Dependency export form for targeted .provide() lifts. */
export type DepsExportKind = "layer" | "servicemap" | "array";

/** Result of classifyDepsExport; "unknown" means validation must fail. */
export type DepsExportClassification = DepsExportKind | "unknown";

/** Classify dependency default export for optimal provide lift. Uses api; node.kind "array" for T[]. */
export function classifyDepsExport(
  node: TypeNode,
  api: TypeInfoApi,
): DepsExportClassification {
  if (api.isAssignableTo(node, "Layer")) return "layer";
  if (api.isAssignableTo(node, "ServiceMap")) return "servicemap";
  if (node.kind === "array") return "array";
  return "unknown";
}

/** True iff the type node is a function whose first parameter expects RefSubject. */
export function typeNodeExpectsRefSubjectParam(node: TypeNode, api: TypeInfoApi): boolean {
  if (!isCallableNode(node)) return false;
  const params = getCallableParameters(node);
  if (!params || params.length === 0) return false;
  return api.isAssignableTo(node, "RefSubject", [{ kind: "param", index: 0 }]);
}

/**
 * True iff the function's return type is Effect and Effect's success type (first type arg) is assignable to Option.
 */
export function typeNodeIsEffectOptionReturn(node: TypeNode, api: TypeInfoApi): boolean {
  return api.isAssignableTo(node, "Option", [
    { kind: "returnType" },
    { kind: "ensure", targetId: "Effect" },
    { kind: "typeArg", index: 0 },
  ]);
}

/**
 * Classify catch handler form: native (RefSubject=>Fx), fn-cause ((Cause)=>...), fn-error ((E)=>...), or value.
 */
export type CatchForm =
  | { form: "native"; returnKind: RuntimeKind }
  | { form: "value"; returnKind: RuntimeKind }
  | { form: "fn-cause"; returnKind: RuntimeKind }
  | { form: "fn-error"; returnKind: RuntimeKind };

export function classifyCatchForm(node: TypeNode, api: TypeInfoApi): CatchForm {
  const returnType = getCallableReturnType(node);
  const returnKind = returnType
    ? typeNodeToRuntimeKind(returnType, api)
    : typeNodeToRuntimeKind(node, api);
  if (!isCallableNode(node)) {
    return { form: "value", returnKind };
  }
  const params = getCallableParameters(node);
  if (!params || params.length === 0) return { form: "fn-error", returnKind };
  if (api.isAssignableTo(node, "RefSubject", [{ kind: "param", index: 0 }]))
    return { form: "native", returnKind };
  if (api.isAssignableTo(node, "Cause", [{ kind: "param", index: 0 }]))
    return { form: "fn-cause", returnKind };
  return { form: "fn-error", returnKind };
}
