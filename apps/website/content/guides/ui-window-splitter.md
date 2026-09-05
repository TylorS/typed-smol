---
title: "WindowSplitter: accessible range state for resizable panes"
summary: "Connect keyboard resizing to real layout and distinguish range semantics from drag interaction."
section: "UI / Collections"
kind: "deep-dive"
order: 251
---

An inspector sits beside a document. The user needs more room for property names, so they focus
the divider and press Right. A working splitter must change both the pane's actual width and the
value announced for the divider. We will bind those outputs to one state, then follow collapse and
restore to see why the current width and remembered width differ. The example implements keyboard
resizing; pointer dragging is a separate integration, not behavior supplied by a resize cursor.

## Bind the value to a pane's width

This splitter measures the primary pane in pixels. Its minimum is deliberately nonzero, so collapse
means the smallest permitted width rather than hiding navigation completely. The visible keyboard
hint and accessible value text make that unit explicit.

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as WindowSplitter from "@typed/ui/WindowSplitter";

export const ResizableInspector = component(function* () {
  const state = yield* WindowSplitter.makeState({
    value: 280, min: 160, max: 480, step: 20, orientation: "vertical",
  });
  const width = RefSubject.map(state, ({ value }) => `flex: 0 0 ${value}px; min-width: 0;`);
  return html`<section>
    <p id="inspector-resize-help">Focus the divider. Left and Right resize; Enter collapses or restores.</p>
    <div style="display: flex; max-width: 100%;">
      <aside id="inspector-pane" style=${width}>
        <h2>Inspector</h2><p>Selected project properties.</p>
      </aside>
      ${WindowSplitter.WindowSplitter({ state, primaryPaneId: "inspector-pane", label: "Inspector width",
        valueText: RefSubject.map(state, ({ value }) => `${value} pixels`),
        props: { "aria-describedby": "inspector-resize-help", style: "width: 12px; flex: 0 0 12px;" },
      })}
      <main style="flex: 1; min-width: 0;"><h2>Project content</h2></main>
    </div>
  </section>`;
});
```

The separator's `primaryPaneId` points to the existing aside. State drives both CSS width and
`aria-valuenow`; `valueText` supplies readable units. This minimal layout demonstrates keyboard
resizing. A production layout still needs a visible focus indicator, a discoverable divider, and
responsive bounds that leave enough room for the second pane.

## Understand orientation and collapse memory

Orientation describes the separator line, not the direction the pane grows. A vertical separator
uses Left/Right; a horizontal separator uses Up/Down. Arrows apply `step`, Home selects `min`, End
selects `max`, and Enter calls `toggleCollapsed`. The separator remains a normal tab stop. When its
rendered `aria-disabled` is true, the family keyboard handler does not change state.

`setValue` and `adjust` clamp to the configured range. `toggleCollapsed` records the current value
in `previousValue` when collapsing to min, and restores that recorded value when already at min.
Ordinary resizing does not update the restore value. That distinction matters if another control
jumps to min: Enter then restores the previously recorded collapse value, not necessarily the most
recent width before that jump.

The constructor validates finite structural values through its schema but does not enforce the
relationships `min <= max` or `step > 0`. Supply those semantic constraints yourself. A zero step
makes arrow presses inert; a negative step reverses conventional movement. If viewport changes
alter available space, update constraints and clamp the current size coherently rather than
exposing an impossible layout range.

## Pointer dragging is a separate implementation

The current primitive installs keyboard behavior, not pointer-drag listeners. It does not calculate
coordinates, capture pointers, map RTL layout, or persist pane preferences. A pointer integration
must use the same `setValue` transition as keyboard updates so range attributes and layout remain
consistent. Plan pointer capture and cancellation, and account for scroll offsets and CSS scaling
when converting coordinates to your value units. Do not advertise dragging solely by applying a
resize cursor to this keyboard-only example.

The [APG window splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/) describes
the focusable separator interaction. [MDN's separator role reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role)
distinguishes a static separator from an adjustable one. This component uses `role=separator` with
range and controls attributes; a decorative `Separator` is not interchangeable with it.

## Validate the layout and the announced range together

State tests can prove clamping, Home/End targets, and collapse/restore memory. Browser tests must
also inspect actual pane width, the focused separator, and `aria-valuenow` after keys. Test both
orientations and disabled behavior, and check the minimum width in a narrow viewport. If the number
changes but layout does not, inspect the style subscription. If layout changes but the announced
value is stale, look for a second sizing state bypassing the family.

The splitter does not need a collection and has no selected-versus-active item distinction: its
value is a continuous layout choice and its focus is the actual separator. Keep that simpler model
instead of importing a roving registry intended for multi-item widgets.
Public API: [WindowSplitter](/reference/modules/%40typed%2Fui%2FWindowSplitter).
