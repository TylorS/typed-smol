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

/** Classify dependency default export for optimal provide lift. Uses api; node.kind "array" or "tuple" for T[] / [T, ...]. */
export function classifyDepsExport(node: TypeNode, api: TypeInfoApi): DepsExportClassification {
  if (api.isAssignableTo(node, "Layer")) return "layer";
  if (api.isAssignableTo(node, "ServiceMap")) return "servicemap";
  if (node.kind === "array" || node.kind === "tuple") return "array";
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
  if (
    api.isAssignableTo(node, "Option", [
      { kind: "returnType" },
      { kind: "ensure", targetId: "Effect" },
      { kind: "typeArg", index: 0 },
    ])
  ) {
    return true;
  }

  const returnType = getCallableReturnType(node);
  if (!returnType || !api.isAssignableTo(returnType, "Effect")) return false;
  const successType = findEffectSuccessType(returnType, api);
  return successType ? typeNodeContainsAssignableOption(successType, api) : false;
}

function typeNodeContainsAssignableOption(node: TypeNode, api: TypeInfoApi): boolean {
  if (api.isAssignableTo(node, "Option") || typeNodeLooksLikeOption(node)) return true;
  for (const child of typeNodeChildren(node)) {
    if (typeNodeContainsAssignableOption(child, api)) return true;
  }
  return false;
}

function typeNodeLooksLikeOption(node: TypeNode): boolean {
  if (node.kind === "reference") return /^(Option|Some|None)(<|$)/.test(node.text);
  if (node.kind !== "union") return false;
  return node.elements.every((element) => typeNodeLooksLikeOption(element));
}

function findEffectSuccessType(node: TypeNode, api: TypeInfoApi): TypeNode | undefined {
  if (node.kind === "reference" && api.isAssignableTo(node, "Effect")) {
    return node.typeArguments?.[0];
  }
  for (const child of typeNodeChildren(node)) {
    const successType = findEffectSuccessType(child, api);
    if (successType) return successType;
  }
  return undefined;
}

function typeNodeChildren(node: TypeNode): readonly TypeNode[] {
  switch (node.kind) {
    case "array":
    case "intersection":
    case "tuple":
    case "union":
      return node.elements;
    case "conditional":
      return [node.checkType, node.extendsType, node.trueType, node.falseType];
    case "constructor":
    case "function":
      return [...node.parameters.map((parameter) => parameter.type), node.returnType];
    case "indexSignature":
      return [node.keyType, node.valueType];
    case "indexedAccess":
      return [node.objectType, node.indexType];
    case "mapped":
      return [node.constraintType, node.mappedType];
    case "object":
      return node.properties.map((property) => property.type);
    case "overloadSet":
      return node.signatures.flatMap((signature) => [
        ...signature.parameters.map((parameter) => parameter.type),
        signature.returnType,
      ]);
    case "reference":
      return node.typeArguments ?? [];
    case "templateLiteral":
      return node.types;
    case "typeOperator":
      return [node.type];
    default:
      return [];
  }
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
