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

/**
 * True iff the type is a reference to Route (i.e. `typeof import("@typed/router").Route.Any`).
 * Only Route types from Route.make/Parse/Join/etc. are accepted; ad-hoc object shapes are rejected.
 */
export function typeNodeIsRouteCompatible(node: TypeNode): boolean {
  if (node.kind !== "reference") return false;
  const name = getReferenceTypeName((node as ReferenceTypeNode).text);
  return name === "Route";
}

export type RuntimeKind = "fx" | "effect" | "stream" | "plain";

/** Match type display text for Fx/Stream/Effect (reference or interface typeToString). */
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
  return runtimeKindFromTypeText(n.text);
}

/**
 * Structurally determines runtime kind from the type node (same approach as Route):
 * if the (possibly function-return) type is a reference to Fx, Stream, or Effect, return that kind.
 * Also checks type display text so interface types (e.g. Fx<A>, Effect<A>) from @typed/fx and effect are recognized.
 * Recurses into union/intersection so Pipeable & Fx<A> is still classified as fx.
 */
export function typeNodeToRuntimeKind(node: TypeNode): RuntimeKind {
  const root = node.kind === "function" ? (node as FunctionTypeNode).returnType : node;
  return runtimeKindFromNode(root);
}

/**
 * True iff the type node is a function whose return type is structurally Effect<Option<*>, *, *>.
 * Used to validate guard exports.
 */
export function typeNodeIsEffectOptionReturn(node: TypeNode): boolean {
  const returnType = node.kind === "function" ? (node as FunctionTypeNode).returnType : node;
  if (returnType.kind !== "reference") return false;
  const ref = returnType as ReferenceTypeNode;
  const name = getReferenceTypeName(ref.text);
  if (name !== "Effect") return false;
  const args = ref.typeArguments;
  if (!args || args.length < 1) return false;
  const first = args[0];
  if (first.kind !== "reference") return false;
  const optionName = getReferenceTypeName((first as ReferenceTypeNode).text);
  return optionName === "Option";
}
