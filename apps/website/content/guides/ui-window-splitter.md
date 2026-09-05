---
title: "WindowSplitter: accessible range state for resizable panes"
summary: "Connect native pointer dragging and keyboard resizing to the same bounded pane layout."
section: "UI / Collections"
kind: "deep-dive"
order: 251
---

An inspector sits beside a document. The user needs more room for property names, so they focus
the divider and press Right, or drag it with a pointer. A working splitter must change both the pane's actual width and the
value announced for the divider. We will bind those outputs to one state, then follow collapse and
restore to see why the current width and remembered width differ. Both interactions update the same bounded value. The component owns the native drag session;
the application binds that value to the actual pane layout.

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
    <p id="inspector-resize-help">Drag the divider, or focus it and use Left/Right. Enter collapses or restores.</p>
    <div style="display: flex; max-width: 100%;">
      <aside id="inspector-pane" style=${width}>
        <h2>Inspector</h2><p>Selected project properties.</p>
      </aside>
      ${WindowSplitter.WindowSplitter({ state, primaryPaneId: "inspector-pane", label: "Inspector width", valuePerPixel: 1,
        valueText: RefSubject.map(state, ({ value }) => `${value} pixels`),
        props: { "aria-describedby": "inspector-resize-help", style: "width: 12px; flex: 0 0 12px; cursor: col-resize; background: currentColor;" },
      })}
      <main style="flex: 1; min-width: 0;"><h2>Project content</h2></main>
    </div>
  </section>`;
});
```

The separator's `primaryPaneId` points to the existing aside. State drives both CSS width and
`aria-valuenow`; `valueText` supplies readable units. `valuePerPixel: 1` makes one CSS pixel of pointer movement add one pixel to pane width. A production layout still needs a visible focus indicator, a discoverable divider, and
responsive bounds that leave enough room for the second pane.

## Understand orientation and collapse memory

Orientation describes the separator line, not the direction the pane grows. A vertical separator
uses Left/Right; a horizontal separator uses Up/Down. Arrows apply `step`, Home selects `min`, End
selects `max`, and Enter calls `toggleCollapsed`. The separator remains a normal tab stop. When its
rendered `aria-disabled` is true, keyboard and pointer handlers do not change state. Disabling during a drag ends that drag
on its next pointer movement.

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

## Translate pointer movement into the same value

The component captures the primary pointer on a left-button/touch press, keeping movement attached
to the separator even when the pointer crosses into either pane. Vertical separators use horizontal
movement; horizontal separators use vertical movement. The gesture starts from the current value,
so grabbing an edge of a thick handle does not snap the layout to the pointer's absolute position.
Every movement goes through `setValue`, retaining the same min/max clamp as keyboard changes.

Without `valuePerPixel`, the parent dimension minus separator thickness represents 100 value units.
This fits the default percentage range and a two-pane grid using `value` and `100 - value` fractional
tracks. The pixel-based example must instead pass `valuePerPixel: 1`. Other units need a positive,
finite scale. The scale and orientation are sampled when a gesture starts; responsive layout changes
during that gesture do not continually reinterpret its origin. Positive axis-aligned CSS scaling
is included in the conversion: pointer coordinates and separator thickness use viewport pixels,
while the parent client area excludes borders and scrollbars. Rotation, skew, or reversed visual
layouts need a separate layout/coordinate policy.

Pointer up, cancellation, lost capture, and render-Scope teardown release the session. A second
pointer cannot take over an active gesture. The host composes caller styles with `touch-action: none`
so touch movement remains a resize gesture rather than page scrolling. This uses the normal reactive
style binding and preserves the caller's other style declarations. Keep the full supplied props on
the actual separator when overriding its host.

The component does not persist preferred widths or set pane CSS itself. Persist a chosen value at
an application boundary if needed; keep ARIA and visible layout derived from that same value.

The [APG window splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/) describes
the focusable separator interaction. [MDN's separator role reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/separator_role)
distinguishes a static separator from an adjustable one. This component uses `role=separator` with
range and controls attributes; a decorative `Separator` is not interchangeable with it.

## Validate the layout and the announced range together

State tests can prove clamping, Home/End targets, and collapse/restore memory. Browser tests must
also inspect actual pane width, the focused separator, and `aria-valuenow` after keys and real pointer drags beyond the handle. Test release/cancel and removal during a drag,
then verify later pointer movement cannot resize the removed pane. Test both
orientations and disabled behavior, and check the minimum width in a narrow viewport. If the number
changes but layout does not, inspect the style subscription. If layout changes but the announced
value is stale, look for a second sizing state bypassing the family.

The splitter does not need a collection and has no selected-versus-active item distinction: its
value is a continuous layout choice and its focus is the actual separator. Keep that simpler model
instead of importing a roving registry intended for multi-item widgets.
Public API: [WindowSplitter](/reference/modules/%40typed%2Fui%2FWindowSplitter).
