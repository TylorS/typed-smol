---
title: Direct updates, local reconciliation
summary: What the DOM renderer creates, mounts, hydrates, and reconciles—and the local size each cost depends on.
section: DOM and platform
kind: deep-dive
order: 5
---

`html` is renderer-independent; the DOM behavior here is provided by
[`DomRenderTemplate`](/reference/%40typed%2Ftemplate%2FRender%23DomRenderTemplate). Use
[`render`](/reference/%40typed%2Ftemplate%2FRender%23render) to give that output a root, and
[`many`](/reference/%40typed%2Ftemplate%2Fmany%23many) when collection identity matters.

Start with the distinction this page measures:

```ts
import { Fx } from "@typed/fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { html, many } from "@typed/template";

const status = Fx.succeed("ready");
const items = Fx.succeed([
  { id: "a", label: "A" },
  { id: "b", label: "B" },
]);
const rows = many(
  items,
  (item) => item.id,
  (item) => html`<li>${RefSubject.map(item, (value) => value.label)}</li>`,
);

const view = html`<p>${status}</p><ul>${rows}</ul>`;
```

Updating `status` writes one captured text target: O(1) with respect to the surrounding tree.
Updating `items` runs keyed collection work and local range reconciliation: its cost depends on the
old and new item counts and on the concrete nodes in that list. The table below names those local
sizes precisely.

## What the sizes mean

There is no page-wide `n` in this renderer. Each row below names its own local size:

- `t` is the static nodes plus dynamic parts in one template literal.
- `h` is the existing DOM inspected to build or search a hydration tree below the supplied root.
- `c` is the class-token count; `d` is the data-key count; `p` is the accepted spread-key count
  enumerated once while the template part is installed.
- `r` is the number of concrete nodes in one dynamic range (the interval before its end comment).
- `a` and `b` are the previous and next keyed-array lengths. `Δ` is the number of items whose
  lifecycle or position actually changes; an item renderer's own work is additional.

“Direct” below means direct with respect to the surrounding DOM. Converting a non-scalar value to a
string, running an `Effect`/`Fx`, or the browser's own DOM work can add input-dependent cost.

## Cost table

| Part family                                                    | Construction                                                                                                                                                                                                              | Mount                                                                                                                                                                                                               | Hydration                                                                                                                                                                                                                       | Update                                                                                                                                                                                                                                                                                                                                  | n                                                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Captured text, attribute, property, boolean, and comment parts | The literal is parsed on the first use of that literal; its namespace-specific static fragment is built on the first use in that namespace. This is bounded by `t`, not by later scalar updates.                          | A mount clones that cached fragment and installs every part, so a whole-template mount is proportional to `t`; it is not an O(1) operation.                                                                         | A compatible SSR range is located from Typed markers, then each part is wired to the adopted node. Building/searching the hydration representation depends on `h` and the part path; a failed match falls back to construction. | The retained `Text`, `Attr`, `Element`, or `Comment` target receives one local write: O(1) with respect to the surrounding tree. Attribute/text serialization is additionally proportional to the produced string; sparse text/attribute/class parts combine all their holes first.                                                     | No `n`: one captured target.                                                                                                    |
| `class` and `.data` collections                               | Their updaters retain the local collection state.                                                                                                                                                                         | Included in the `t` part setup above.                                                                                                                                                                                | The same local setup is connected to adopted nodes.                                                                                                                                                                              | Class computes sets/differences over old and new token lists: O(`c_old + c_new`). Dataset enumerates/maps old and new keys: O(`d_old + d_new`).                                                                                                                           | `c` and `d` are local tokens or keys—not DOM descendants or page elements.                                                      |
| `...` spread template                                         | The accepted keys are enumerated once: O(`p`). Each key installs the same retained updater used by an explicitly written attribute, property, boolean, class, data, event, or ref part.                                  | Included in the `t` part setup above; every accepted spread key is connected once.                                                                                                                                  | The same one-time enumeration runs while the adopted parts are connected; hydration refs are collected before reactive setup starts.                                                                                           | After setup, each reactive spread entry updates its already-captured target directly. Its cost is the cost of that individual part—O(1) for scalar attributes, properties, and booleans with respect to the surrounding tree—not another enumeration or comparison of old and new spread templates.                         | `p` is paid once to install the local keys. Later updates use the captured part targeted by the value that changed.             |
| Event handler parts                                            | Parsing records the event part but attaches no native listener.                                                                                                                                                           | The part registers a renderer-local delegated entry; then `EventSource.setup` enumerates the rendered range's concrete element roots and all registered entries, attaching native listeners for each matching pair. | The same registration/setup runs for adopted output.                                                                                                                                                                            | Adding a handler after mounts already exist attaches it to every active mount; disposal removes every attachment. Event dispatch checks whether the registered target contains the native event target before running the handler.                                                                                                      | `e × m`: registered entries times concrete roots across the relevant active mounts. No claim of O(1) event setup.               |
| Dynamic `RenderEvent` range                                    | A node part creates/locates its end marker and retains its current node array.                                                                                                                                            | A primitive makes text; a `DomRenderEvent`, `HtmlRenderEvent`, or nested array is normalized to concrete nodes before local reconciliation. Normalization is O(`r_next`) for an array/range payload.                | The first hydrated dynamic emission is intentionally skipped; the old nodes between that hole's markers are read only when the first later update needs an updater.                                                             | The range diff touches only nodes before that part's end comment. It still compares its local arrays: unchanged head/tail runs cost comparisons proportional to the run length; append/remove/reverse-swap avoid building the map. The map fallback indexes the remaining next range in O(`r_remaining`) and can replace or move nodes. | `r` is concrete nodes in this one hole, never the full page.                                                                    |
| Arrays (not arbitrary iterables) and keyed `many()` lists      | The dynamic normalizer recognizes nested arrays; it does not enumerate a general JavaScript `Iterable`. `many()` creates an O(1) renderer descriptor; it does not subscribe or flatten children into another `Fx`. | At the first source array, the renderer validates keys and creates one child scope, `RefSubject`, and renderer only for each admitted key. | Keyed hydration encodes/uses each key to adopt its rendered range. Duplicate keys fail in DOM and HTML rendering; local symbols fail for hydratable output because their identity cannot be serialized. | Each emitted array validates/builds the next key index, checks the old order for removals, and visits the next values: O(`a + b`) plus key/equality and affected-child work. Retained-key lookup is O(1) on average; equal values skip `RefSubject.set`, so a pure reorder does not publish unchanged item data. Flattening the retained concrete ranges and reconciling their order adds the local `r` work described above. | `a` and `b` are previous/next keyed item counts; `r` is the concrete nodes contributed to this one containing hole. |

## Reconciliation is local, not magically constant

`RenderEvent` values can carry a node, fragment, wire, or nested collection. A node part first
normalizes that payload, then compares the old and new arrays only inside its comment-bounded range.
This gives useful fast paths for empty ranges, equal heads/tails, append/remove, and a reverse swap.
Those paths reduce mutation work, but matching a long unchanged prefix is still linear in that local
prefix. When neither edge matches, the fallback builds a map of the remaining next nodes and may
move or replace nodes; it is deliberately range-scoped, not an unconditional O(1) update.

`many()` gives the renderer a keyed descriptor before that DOM range diff. The DOM renderer owns the
entry map directly: stable keys preserve a child scope and existing `RefSubject`; removed keys close
only their child scope; equal retained values are not republished. This prevents a pure reorder from
rerunning every item, but a list emission still scans its old and new keyed arrays and reconciles the
concrete local range. An ordinary unkeyed dynamic array has no such identity contract: its nodes can
be replaced when they do not match by identity.

## State-preserving moves

For an already-parented node, the range diff calls `ParentNode.moveBefore` first. If that operation
is absent or throws, it falls back to `insertBefore`; a never-parented node goes straight to
`insertBefore`. Both paths preserve the node object, but only a successful platform `moveBefore`
gets the browser's state-preserving move behavior. The renderer does not promise that fallback
insertion preserves every browser-managed state.

## Reading construction, mount, hydration, and update separately

Construction parses and caches a static literal/fragment. Mounting clones that fragment, connects
all parts, and attaches delegated listeners. Hydration first reads existing marked DOM and adopts it
only when the template hash and markers match; it is a compatibility check and setup pass, not a
free scalar update. Updates happen afterward through the retained part target or the dynamic range.
Keeping those phases separate is why a direct text update can be O(1) relative to its tree while the
initial mount or hydration of the same template is proportional to the work it must inspect or wire.
