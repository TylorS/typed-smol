/**
 * Counter - classic TEA example with Increment/Decrement.
 */

import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import type { Dispatch, Cmd, State } from "./Tea.js";

export type Model = { count: number };

export type Msg = { type: "Increment" } | { type: "Decrement" };

export const init: [Model, Cmd<Msg>] = [{ count: 0 }, Fx.never];

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg.type) {
    case "Increment":
      return [{ count: model.count + 1 }, Fx.never];
    case "Decrement":
      return [{ count: model.count - 1 }, Fx.never];
  }
};

export const view =
  ({ count }: State<Model>) =>
  (dispatch: Dispatch<Msg>) => {
    return html`<div>
    <button onclick=${dispatch({ type: "Increment" })}>Increment</button>
    <button onclick=${dispatch({ type: "Decrement" })}>Decrement</button>
    <p>Count: ${count}</p>
  </div>`;
  };
