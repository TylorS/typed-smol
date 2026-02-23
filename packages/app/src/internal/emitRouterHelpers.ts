import type { CatchForm, DepsExportKind, RuntimeKind } from "./routeTypeNode.js";

/**
 * Emit the handler expression that converts to a function returning Fx.
 * Router passes RefSubject<Params> (an Fx) to function handlers.
 */
export function handlerExprFor(
  runtimeKind: RuntimeKind,
  isFn: boolean,
  expectsRefSubject: boolean,
  varName: string,
  exportName: string,
): string {
  const ref = `${varName}.${exportName}`;
  if (isFn && expectsRefSubject) {
    return `(params) => ${ref}(params)`;
  }
  switch (runtimeKind) {
    case "plain":
      return isFn
        ? `(params) => Fx.map(params, ${ref})`
        : `constant(Fx.succeed(${ref}))`;
    case "effect":
      return isFn
        ? `(params) => Fx.mapEffect(params, ${ref})`
        : `constant(Fx.fromEffect(${ref}))`;
    case "stream":
      return isFn
        ? `(params) => Fx.switchMap(params, (p) => Fx.fromStream(${ref}(p)))`
        : `constant(Fx.fromStream(${ref}))`;
    case "fx":
      return isFn ? ref : `constant(${ref})`;
  }
}

/** Lift a value or function result to Fx based on return kind (plain, effect, stream, fx). */
export function liftToFx(expr: string, kind: RuntimeKind): string {
  switch (kind) {
    case "plain":
      return `Fx.succeed(${expr})`;
    case "effect":
      return `Fx.fromEffect(${expr})`;
    case "stream":
      return `Fx.fromStream(${expr})`;
    case "fx":
      return expr;
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
): string {
  const ref = `${varName}.${exportName}`;
  const { form, returnKind } = catchForm;

  if (form === "native") {
    return ref;
  }

  if (form === "value") {
    const lifted = liftToFx(ref, returnKind);
    return `(_causeRef) => ${lifted}`;
  }

  if (form === "fn-cause") {
    const lifted = liftToFx(`${ref}(cause)`, returnKind);
    return `(causeRef) => Fx.flatMap(causeRef, (cause) => ${lifted})`;
  }

  // form === "fn-error": (e) => A | Effect | Stream | Fx — use Cause.findFail + Result.match
  return `(causeRef) => Fx.flatMap(causeRef, (cause) => Result.match(Cause.findFail(cause), { onFailure: (c) => Fx.fromEffect(Effect.failCause(c)), onSuccess: ({ error: e }) => ${liftToFx(`${ref}(e)`, returnKind)} }))`;
}

/** Targeted lift for .provide() based on dependency export kind (layer, servicemap, array). */
export function depsExprFor(kind: DepsExportKind, varName: string): string {
  const ref = `${varName}.default`;
  switch (kind) {
    case "layer":
      return ref;
    case "servicemap":
      return `Layer.succeedServices(${ref})`;
    case "array":
      return `Router.normalizeDependencyInput(${ref})`;
  }
}
