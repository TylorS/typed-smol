# Memory Reflections

- Centralizing id prefix metadata early should reduce schema/RPC duplication in T2 and T3.
- Runtime tests are insufficient for branded protocol ids; keep a build-checked type fixture for negative assignability cases.
- Effect Schema defaults strip excess struct properties, so protocol decode helpers must pass `onExcessProperty: "error"` for bridge inputs.
- Protocol peer names should stay host-neutral; use `extension-panel` in the protocol layer and keep browser API specifics in the Chrome package.
