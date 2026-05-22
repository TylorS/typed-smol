import * as Context from "effect/Context";
import { RefSubject } from "@typed/fx";

export function tag<State extends Record<string, unknown>>(id: string) {
  return Context.Service<RefSubject.RefSubject<State>>(`@typed/ui/${id}`);
}
