import type { CatchForm, DepsExportKind, RuntimeKind } from "./routeTypeNode.js";

export interface RouterExpressionImports {
  readonly router: () => string;
  readonly fx: () => string;
  readonly constant: () => string;
  readonly refSubject: () => string;
  readonly effect: () => string;
  readonly cause: () => string;
  readonly result: () => string;
  readonly layer: () => string;
}

/**
 * Emit the handler expression that converts to a function returning Fx.
 * Router passes RefSubject<Params> (an Fx) to function handlers.
 * Plain sync handlers (value in, value out) always use Fx.map(params, handler).
 */
export function handlerExprFor(
  runtimeKind: RuntimeKind,
  isFn: boolean,
  expectsRefSubject: boolean,
  varName: string,
  exportName: string,
  imports: RouterExpressionImports,
): string {
  const ref = `${varName}.${exportName}`;
  if (runtimeKind === "plain") {
    if (isFn) return `(params) => ${imports.fx()}.map(params, ${ref})`;
    const fx = imports.fx();
    const constant = imports.constant();
    return `${constant}(${fx}.succeed(${ref}))`;
  }
  if (isFn && expectsRefSubject) {
    return `(params) => ${ref}(params)`;
  }
  switch (runtimeKind) {
    case "effect":
      if (isFn) return `(params) => ${imports.fx()}.mapEffect(params, ${ref})`;
      const effectFx = imports.fx();
      const effectConstant = imports.constant();
      return `${effectConstant}(${effectFx}.fromEffect(${ref}))`;
    case "stream":
      if (isFn) {
        const streamFx = imports.fx();
        return `(params) => ${streamFx}.switchMap(params, (p) => ${streamFx}.fromStream(${ref}(p)))`;
      }
      const streamFx = imports.fx();
      const streamConstant = imports.constant();
      return `${streamConstant}(${streamFx}.fromStream(${ref}))`;
    case "fx":
      return ref;
    case "unknown":
      throw new Error(
        "RVM-KIND-001: runtime kind unknown (should have been caught in buildRouteDescriptors)",
      );
  }
}

/** Lift a value or function result to Fx based on return kind (plain, effect, stream, fx). */
export function liftToFx(
  expr: string,
  kind: RuntimeKind,
  imports: RouterExpressionImports,
): string {
  switch (kind) {
    case "plain":
      return `${imports.fx()}.succeed(${expr})`;
    case "effect":
      return `${imports.fx()}.fromEffect(${expr})`;
    case "stream":
      return `${imports.fx()}.fromStream(${expr})`;
    case "fx":
      return expr;
    case "unknown":
      throw new Error(
        "RVM-KIND-001: runtime kind unknown (should have been caught in buildRouteDescriptors)",
      );
  }
}

/**
 * Emit the catch expression that converts to (causeRef) => Fx form.
 * Supports: value fallbacks, (Cause) => ..., (E) => ..., and native (causeRef) => Fx.
 */
export function catchExprFor(
  catchForm: CatchForm,
  varName: string,
  exportName: string,
  imports: RouterExpressionImports,
): string {
  const ref = `${varName}.${exportName}`;
  const { form, returnKind } = catchForm;
  const causeRef = `(causeRef: ${imports.refSubject()}<${imports.cause()}.Cause<any>>)`;

  if (form === "native") {
    return ref;
  }

  if (form === "value") {
    const lifted = liftToFx(ref, returnKind, imports);
    return `(_causeRef: ${imports.refSubject()}<${imports.cause()}.Cause<any>>) => ${lifted}`;
  }

  if (form === "fn-cause") {
    const lifted = liftToFx(`${ref}(cause)`, returnKind, imports);
    return `${causeRef} => ${imports.fx()}.flatMap(causeRef, (cause) => ${lifted})`;
  }

  // form === "fn-error": (e) => A | Effect | Stream | Fx — use Cause.findFail + Result.match
  return `${causeRef} => ${imports.fx()}.flatMap(causeRef, (cause) => ${imports.result()}.match(${imports.cause()}.findFail(cause), { onFailure: (c) => ${imports.fx()}.fromEffect(${imports.effect()}.failCause(c)), onSuccess: ({ error: e }) => ${liftToFx(`${ref}(e)`, returnKind, imports)} }))`;
}

/** Targeted lift for .provide() based on dependency export kind (layer, servicemap, array). */
export function depsExprFor(
  kind: DepsExportKind,
  varName: string,
  imports: RouterExpressionImports,
): string {
  const ref = `${varName}.default`;
  switch (kind) {
    case "layer":
      return ref;
    case "servicemap":
      return `${imports.layer()}.succeedContext(${ref})`;
    case "array":
      return `${imports.router()}.normalizeDependencyInput(${ref})`;
  }
}
