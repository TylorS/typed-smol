# Memory Reflections

- Centralizing id prefix metadata early should reduce schema/RPC duplication in T2 and T3.
- Runtime tests are insufficient for branded protocol ids; keep a build-checked type fixture for negative assignability cases.
- Effect Schema defaults strip excess struct properties, so protocol decode helpers must pass `onExcessProperty: "error"` for bridge inputs.
- Protocol peer names should stay host-neutral; use `extension-panel` in the protocol layer and keep browser API specifics in the Chrome package.
- `Schema.Number` is not sufficient for protocol JSON compatibility; use finite-number checks anywhere payloads cross the bridge.
- `RpcTest.makeClient` and `RpcGroup.toLayer` give enough host-neutral coverage for protocol RPC definitions before browser/dev-server adapters exist.
