# ADR: Typed UI Popover Uses Native HTML Popover Only

Status: accepted

## Context

The first `@typed/ui` component tranche includes Popover alongside Disclosure and Dialog. The human clarified that Popover should use only the native Popover API. Current MDN and WHATWG documentation define native popovers as non-modal top-layer elements controlled by `popover`, `popovertarget`, `popovertargetaction`, and the `showPopover`/`hidePopover`/`togglePopover` methods.

## Decision

`@typed/ui` Popover v1 will be backed only by the native HTML Popover API.

- Popover is non-modal.
- Dialog owns modal behavior and focus trapping.
- Popover should prefer declarative native invoker relationships.
- Store state mirrors native DOM state through refs/startup reads and native toggle events.
- `@typed/ui` will not implement custom Popover overlay mechanics, custom Popover focus trapping, or a JS-only visibility fallback.

## Consequences

- Browser behavior carries more of the accessibility and focus-order burden.
- Older environments without native Popover API are not silently supported by a custom polyfill.
- Ariakit-like Popover APIs must be mapped to native browser semantics instead of reproducing Ariakit internals.
- Some custom behavior may be deferred or rejected if it conflicts with native Popover constraints.

## Alternatives considered

- Custom overlay Popover: rejected because it conflicts with the explicit native-only constraint.
- Dialog-backed Popover: rejected for Popover v1 because native Popover is non-modal and Dialog already owns modal behavior.
- Polyfilled Popover: rejected for this tranche; unsupported environments should be explicit rather than hidden behind custom mechanics.

## References

- `.docs/workflows/20260521-2247-typed-native-ariakit-port/requirements.md`
- `.docs/workflows/20260521-2247-typed-native-ariakit-port/02-research.md`
- MDN Popover API
- WHATWG HTML Popover
