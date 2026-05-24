import { describe, expect, it } from "vitest";
import {
  renderResumabilityCoverageMatrix,
  unknownCoverageCells,
} from "./coverageMatrix.js";

describe("resumability coverage matrix", () => {
  it("has no unknown cells for route, template, event, and first-party UI v1", () => {
    expect(unknownCoverageCells()).toMatchInlineSnapshot(`[]`);
  });

  it("renders the checked-in matrix as an inline snapshot", () => {
    expect(renderResumabilityCoverageMatrix()).toMatchInlineSnapshot(`
      "| Area | Pattern | Classify | Transform | Typecheck | Serialize | Resume | HMR Compatible | HMR Incompatible | Diagnostics Parity |
      | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
      | route | parameter context services | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | route | Context.Service captures | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | route | RefSubject.Service captures | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | route | inline RefSubject.make migration | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | route | serializable const values | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | route | template value captures | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | route | outer let/var captures | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed |
      | route | any/unknown captures | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed |
      | route | dynamic service ids | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed |
      | route | anonymous class instances | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed |
      | template | data-typed-resume load | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | template | data-typed-resume idle | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | template | data-typed-resume visible | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | template | data-typed-resume hover | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | template | data-typed-resume interaction | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | template | data-typed-resume focus | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | event | EventHandler.action | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | event | EventHandler.make | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed |
      | event | raw function handlers | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed |
      | ui | Disclosure | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | ui | Checkbox | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | ui | Popover | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | ui | Dialog | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | ui | Select | resumable | resumable | resumable | resumable | resumable | resumable | resumable | resumable |
      | ui | custom host renderers | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed |
      | ui | function refs | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed |
      | ui | WeakMap-only state | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed | fail-closed |"
    `);
  });
});
