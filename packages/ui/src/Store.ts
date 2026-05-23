import { RefSubject } from "@typed/fx";

export function useStoreState<S, A, E = never, R = never>(
  store: RefSubject.RefSubject<S, E, R>,
  selector: (state: S) => A,
): RefSubject.Computed<A, E, R> {
  return RefSubject.map(store, selector);
}

