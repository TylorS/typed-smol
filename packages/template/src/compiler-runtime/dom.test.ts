import { describe, expect, it } from "vitest";
import { Fx, Sink } from "@typed/fx";
import * as Effect from "effect/Effect";
import { Window } from "happy-dom";
import { defineDomTemplate, getCommentAtPath, getElementAtPath, bindNode } from "./dom.js";

describe("compiler-runtime DOM templates", () => {
  it("clones cached static HTML and binds dynamic node parts by path", async () => {
    const window = new Window();
    const root = window.document.createElement("div");
    const view = defineDomTemplate<[string]>({
      html: "<main><h1>Title</h1><!--n_0--></main>",
      templateHash: "dom-test",
      mount: (instance, values, runtime) => {
        const main = getElementAtPath<HTMLElement>(instance.root, [0]);
        const anchor = getCommentAtPath(main, [1]);

        expect(main.tagName).toBe("MAIN");
        return bindNode(anchor, values[0], "plain", runtime);
      },
    });

    const nodes = await view("Hello").renderInto(root);

    expect(nodes).toHaveLength(1);
    expect(root.innerHTML).toBe("<main><h1>Title</h1>Hello<!--n_0--></main>");
  });

  it("mounts long-lived Fx bindings before renderInto resolves", async () => {
    const window = new Window();
    const root = window.document.createElement("div");
    const child = Fx.make<Node, never, never>((sink: Sink.Sink<Node>) =>
      Effect.gen(function* () {
        yield* sink.onSuccess(window.document.createTextNode("Live"));
        return yield* Effect.never;
      }),
    );
    const view = defineDomTemplate<[typeof child]>({
      html: "<main><!--n_0--></main>",
      templateHash: "dom-fx-test",
      mount: (instance, values, runtime) =>
        bindNode(getCommentAtPath(getElementAtPath(instance.root, [0]), [0]), values[0], "fx", runtime),
    });

    const nodes = await view(child).renderInto(root);

    expect(nodes).toHaveLength(1);
    expect(root.innerHTML).toBe("<main>Live<!--n_0--></main>");
  });
});
