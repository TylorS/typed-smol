import type {
  FunctionTypeNode,
  IntersectionTypeNode,
  ReferenceTypeNode,
  TypeNode,
  UnionTypeNode,
} from "@typed/virtual-modules";

/**
 * Returns the unqualified type name of a reference type (e.g. "Route" from "Route<...>" or "Router.Route").
 */
export function getReferenceTypeName(text: string): string {
  const withoutTypeArgs = text.includes("<") ? text.split("<")[0].trim() : text.trim();
  const lastSegment = withoutTypeArgs.split(".").pop();
  return lastSegment ?? withoutTypeArgs;
}

/** Optional assignability result from TypeInfoApi when typeTargets are provided. */
export type AssignableTo = Readonly<Record<string, boolean>> | undefined;

/**
 * True iff the type is structurally assignable to Route.
 * Uses assignableTo.Route when available (structural); fallback to type text when absent.
 * Route.Slash, Route.Param, etc. have text like "Route.Slash" — accept when text starts with "Route" or first segment is "Route".
 */
export function typeNodeIsRouteCompatible(node: TypeNode, assignableTo?: AssignableTo): boolean {
  if (assignableTo?.Route === true) return true;
  const text = node.text;
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed === "Route") return true;
  const withoutTypeArgs = trimmed.includes("<") ? trimmed.split("<")[0].trim() : trimmed;
  const firstSegment = withoutTypeArgs.split(".")[0];
  return firstSegment === "Route";
}

export type RuntimeKind = "fx" | "effect" | "stream" | "plain";

/** Match type display text for Fx/Stream/Effect. */
function runtimeKindFromTypeText(text: string): RuntimeKind {
  const name = getReferenceTypeName(text);
  if (name === "Fx") return "fx";
  if (name === "Stream") return "stream";
  if (name === "Effect") return "effect";
  return "plain";
}

function runtimeKindFromNode(n: TypeNode): RuntimeKind {
  if (n.kind === "reference") return runtimeKindFromTypeText((n as ReferenceTypeNode).text);
  if (n.kind === "union")
    for (const el of (n as UnionTypeNode).elements) {
      const k = runtimeKindFromNode(el);
      if (k !== "plain") return k;
    }
  if (n.kind === "intersection")
    for (const el of (n as IntersectionTypeNode).elements) {
      const k = runtimeKindFromNode(el);
      if (k !== "plain") return k;
    }
  return "plain";
}

/**
 * Structurally determines runtime kind. Uses assignableTo when available; fallback to reference name when absent.
 */
export function typeNodeToRuntimeKind(node: TypeNode, assignableTo?: AssignableTo): RuntimeKind {
  if (assignableTo?.Fx === true) return "fx";
  if (assignableTo?.Effect === true) return "effect";
  if (assignableTo?.Stream === true) return "stream";
  const root = node.kind === "function" ? (node as FunctionTypeNode).returnType : node;
  return runtimeKindFromNode(root);
}

/** Dependency export form for targeted .provide() lifts. */
export type DepsExportKind = "layer" | "servicemap" | "array";

/** Result of classifyDepsExport; "unknown" means validation must fail. */
export type DepsExportClassification = DepsExportKind | "unknown";

/** Classify dependency default export for optimal provide lift. Uses structural assignableTo when available; fallback to type text when absent (e.g. test fixtures with unresolved modules). */
export function classifyDepsExport(
  node: TypeNode,
  assignableTo?: AssignableTo,
): DepsExportClassification {
  if (assignableTo?.Layer === true) return "layer";
  if (assignableTo?.ServiceMap === true) return "servicemap";
  const text = node.text;
  if (text && typeof text === "string") {
    const firstSegment = text.split(/[.<]/)[0]?.trim();
    if (firstSegment === "Layer") return "layer";
    if (firstSegment === "ServiceMap") return "servicemap";
  }
  if (node.kind === "reference") {
    const name = getReferenceTypeName((node as ReferenceTypeNode).text);
    if (name === "Array" || name === "ReadonlyArray") return "array";
  }
  if (node.kind === "array") return "array";
  return "unknown";
}

/** True iff the type is a reference to RefSubject (e.g. RefSubject<Params> or RefSubject.RefSubject<Params>). */
export function typeNodeIsRefSubject(node: TypeNode): boolean {
  if (node.kind === "reference") {
    const name = getReferenceTypeName((node as ReferenceTypeNode).text);
    return name === "RefSubject";
  }
  if (node.kind === "intersection")
    return (node as IntersectionTypeNode).elements.some(typeNodeIsRefSubject);
  return false;
}

/** True iff the type node is a function whose first parameter expects RefSubject. */
export function typeNodeExpectsRefSubjectParam(node: TypeNode): boolean {
  if (node.kind !== "function") return false;
  const fn = node as FunctionTypeNode;
  const first = fn.parameters[0];
  if (!first) return false;
  return typeNodeIsRefSubject(first.type);
}

/** True iff a single type node is a reference to Effect<Option<*>, *, *>. */
function typeNodeIsEffectOptionRef(node: TypeNode): boolean {
  if (node.kind !== "reference") return false;
  const ref = node as ReferenceTypeNode;
  const name = getReferenceTypeName(ref.text);
  if (name !== "Effect") return false;
  const args = ref.typeArguments;
  if (!args || args.length < 1) return false;
  const first = args[0];
  if (first.kind !== "reference") return false;
  const optionName = getReferenceTypeName((first as ReferenceTypeNode).text);
  return optionName === "Option";
}

/**
 * True iff the type node is a function whose return type is structurally Effect<Option<*>, *, *>.
 * Used to validate guard exports. Recurses into union/intersection so Pipeable & Effect<Option<...>> is accepted.
 */
export function typeNodeIsEffectOptionReturn(node: TypeNode): boolean {
  const returnType = node.kind === "function" ? node.returnType : node;
  if (typeNodeIsEffectOptionRef(returnType)) return true;
  if (returnType.kind === "union") return returnType.elements.some(typeNodeIsEffectOptionReturn);
  if (returnType.kind === "intersection")
    return returnType.elements.some(typeNodeIsEffectOptionReturn);
  return false;
}

/** True iff the type node is a reference to Cause (e.g. Cause<*>, Cause.Cause<*>. */
function typeNodeIsCauseRef(node: TypeNode): boolean {
  if (node.kind === "reference") {
    const name = getReferenceTypeName((node as ReferenceTypeNode).text);
    return name === "Cause";
  }
  if (node.kind === "intersection")
    return (node as IntersectionTypeNode).elements.some(typeNodeIsCauseRef);
  return false;
}

/**
 * Classify catch handler form: native (RefSubject=>Fx), fn-cause ((Cause)=>...), fn-error ((E)=>...), or value.
 * Used to emit optimal lift into (causeRef) => Fx form.
 */
export type CatchForm =
  | { form: "native"; returnKind: RuntimeKind }
  | { form: "value"; returnKind: RuntimeKind }
  | { form: "fn-cause"; returnKind: RuntimeKind }
  | { form: "fn-error"; returnKind: RuntimeKind };

export function classifyCatchForm(node: TypeNode, assignableTo?: AssignableTo): CatchForm {
  if (node.kind !== "function") {
    const returnKind = typeNodeToRuntimeKind(node, assignableTo);
    return { form: "value", returnKind };
  }
  const fn = node as FunctionTypeNode;
  const returnKind = typeNodeToRuntimeKind(node, assignableTo);
  const firstParam = fn.parameters[0];
  if (!firstParam) return { form: "fn-error", returnKind };
  if (typeNodeIsRefSubject(firstParam.type)) return { form: "native", returnKind };
  if (typeNodeIsCauseRef(firstParam.type)) return { form: "fn-cause", returnKind };
  return { form: "fn-error", returnKind };
}
