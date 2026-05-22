import type * as ts from "typescript";
import {
  createTypeInfoApiSessionFactory,
  type CreateTypeInfoApiSession,
  type TypeInfoApiSession,
  type TypeTargetSpec,
} from "@typed/virtual-modules";

interface CreateLazyTypeInfoApiSessionOptions {
  readonly ts: typeof import("typescript");
  readonly createProgram: () => ts.Program;
  readonly typeTargetSpecs?: readonly TypeTargetSpec[];
  readonly createSessionFactory?: (
    options: Parameters<typeof createTypeInfoApiSessionFactory>[0],
  ) => CreateTypeInfoApiSession;
}

export function createLazyTypeInfoApiSession(
  options: CreateLazyTypeInfoApiSessionOptions,
): CreateTypeInfoApiSession {
  let createSession: CreateTypeInfoApiSession | undefined;
  return (params): TypeInfoApiSession => {
    createSession ??= (options.createSessionFactory ?? createTypeInfoApiSessionFactory)({
      ts: options.ts,
      program: options.createProgram(),
      ...(options.typeTargetSpecs?.length ? { typeTargetSpecs: options.typeTargetSpecs } : {}),
    });
    return createSession(params);
  };
}
