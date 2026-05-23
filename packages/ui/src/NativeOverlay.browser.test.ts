import { assert, describe, it } from "vitest";

describe("typed/ui native overlay baseline", () => {
  it("uses the platform popover API", () => {
    const popover = document.createElement("div");
    popover.popover = "auto";
    document.body.append(popover);

    popover.showPopover();
    assert.strictEqual(popover.matches(":popover-open"), true);

    popover.hidePopover();
    assert.strictEqual(popover.matches(":popover-open"), false);
    popover.remove();
  });

  it("uses the platform dialog API", () => {
    const dialog = document.createElement("dialog");
    document.body.append(dialog);

    dialog.showModal();
    assert.strictEqual(dialog.open, true);

    dialog.close();
    assert.strictEqual(dialog.open, false);
    dialog.remove();
  });
});
