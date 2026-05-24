# Typed DevTools Chrome Manual Smoke

## Automated Smoke

Run the automated smoke before any browser pass:

```sh
pnpm --filter @typed/devtools-chrome exec vitest run src/devtoolsSmoke.test.ts
pnpm --filter @typed/devtools-chrome build
```

The automated smoke covers:

- Manifest V3 `devtools_page` metadata through `makeTypedDevtoolsManifest`.
- Typed panel registration through `chrome.devtools.panels.create`.
- Elements sidebar selection rendering from a protocol `DomBindingResolution`.
- Sources Analyzer sidebar rendering through a `chrome.runtime` `AnalyzeSource` request.
- Runtime connect, disconnect, and reconnect after an extension reload.

## Current Browser Blocker

Browser load-unpacked smoke is blocked in this tranche because `@typed/devtools-chrome`
currently builds TypeScript modules into `dist`, but does not yet emit a complete unpacked
extension root containing:

- `manifest.json`
- `devtools.html`
- `panel.html`
- `elementsSidebar.html`
- `sourcesSidebar.html`
- icon assets referenced by the manifest or panel registration

Chrome's Load unpacked flow requires selecting an extension directory that contains
`manifest.json`.

## Manual Browser Smoke Steps

Use these steps once the unpacked extension root exists.

### Load unpacked

1. Run `pnpm --filter @typed/devtools-chrome build`.
2. Confirm the chosen unpacked extension directory contains `manifest.json`.
3. Open `chrome://extensions`.
4. Enable Developer Mode.
5. Click Load unpacked.
6. Select the unpacked Typed DevTools extension directory.
7. Confirm Chrome shows `Typed DevTools` with no extension load errors.

### Typed panel

1. Open the public-beta fixture app in Chrome.
2. Open DevTools for the inspected page.
3. Confirm the DevTools toolbar includes the Typed panel.
4. Open the Typed panel.
5. Confirm the panel loads `panel.html` without console errors.

### Elements sidebar

1. In DevTools, open the Elements panel.
2. Select a DOM node that belongs to a Typed component in the public-beta fixture.
3. Confirm the Elements sidebar includes `Typed`.
4. Confirm the Elements sidebar renders the selected component, template, Fx, and RefSubject links.
5. Select a non-Typed DOM node and confirm the sidebar renders an explicit unbound state.

### Sources Analyzer

1. In DevTools, open the Sources panel.
2. Open a source file from the public-beta fixture.
3. Select a source location that corresponds to a Typed component, Fx, or RefSubject fact.
4. Confirm the Sources Analyzer sidebar renders protocol SourceFacts with stable `typed://` links.
5. Disable or disconnect the analyzer bridge and confirm the sidebar renders an explicit unavailable state.

### Reload and reconnect

1. Return to `chrome://extensions`.
2. Click the reload control for `Typed DevTools`.
3. Reload the inspected fixture page.
4. Reopen DevTools.
5. Confirm the Typed panel reconnects through `chrome.runtime.connect`.
6. Repeat the Elements sidebar and Sources Analyzer checks.
7. Confirm no stale component, Fx, RefSubject, or source rows from the previous DevTools session remain visible.

## Evidence To Record

Record the Chrome version, extension directory path, fixture URL, and any blocked assertion.
If the unpacked extension root is still missing, record that as the blocker rather than
claiming browser smoke coverage.
