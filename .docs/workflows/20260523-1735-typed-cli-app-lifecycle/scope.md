# Scope

## In Scope

- Add a product-facing `typed dev` command.
- Keep the existing `typed serve` command as a compatibility alias.
- Make `typed build` run the virtual-module compiler before the Vite production build.
- Add `typed check` for non-mutating app checks: virtual-module typecheck, lint, and format check.
- Update generated starter scripts to use the `typed` lifecycle commands.
- Update the RealWorld example scripts and package skeleton tests to match the new contract.
- Add focused CLI tests for the new command surface.

## Out of Scope

- Serverless or platform deployment adapters.
- A `typed deploy` command.
- Replacing the virtual-module compiler implementation.
- Removing low-level escape hatches such as `typed lint`, `typed format`, `typed test`, or `typed run`.

