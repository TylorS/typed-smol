export type RefSubjectDevtoolsEventTag = "Snapshot" | "Updated";

interface RefSubjectDevtoolsEventBase<A> {
  readonly id?: string;
  readonly ownerId?: string;
  readonly serviceId?: string;
  readonly subscriberCount: number;
  readonly value: A;
  readonly version: number;
}

export type RefSubjectDevtoolsEvent<A> =
  | (RefSubjectDevtoolsEventBase<A> & { readonly _tag: "Snapshot" })
  | (RefSubjectDevtoolsEventBase<A> & { readonly _tag: "Updated" });

export interface RefSubjectDevtoolsObserver<A> {
  readonly onSnapshot?: (
    event: Extract<RefSubjectDevtoolsEvent<A>, { readonly _tag: "Snapshot" }>,
  ) => void;
  readonly onUpdate?: (
    event: Extract<RefSubjectDevtoolsEvent<A>, { readonly _tag: "Updated" }>,
  ) => void;
}

export interface RefSubjectDevtoolsOptions<A> {
  readonly id?: string;
  readonly observer?: RefSubjectDevtoolsObserver<A>;
  readonly ownerId?: string;
  readonly serviceId?: string;
}

export function notifyRefSubjectDevtools<A>(
  options: RefSubjectDevtoolsOptions<A> | undefined,
  event: RefSubjectDevtoolsEvent<A>,
): void {
  try {
    if (event._tag === "Snapshot") options?.observer?.onSnapshot?.(event);
    else options?.observer?.onUpdate?.(event);
  } catch {
    // DevTools observers are diagnostic-only and must not affect RefSubject semantics.
  }
}
