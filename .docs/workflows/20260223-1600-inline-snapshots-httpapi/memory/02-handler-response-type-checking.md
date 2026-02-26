# Required: Structural type checking and HttpServerResponse coercion for handler returns

**Source**: User reminder 2026-02-23

## Requirement

1. **Structural type checking**: Handler return type must be assignable to success schema Type; handler error type must be assignable to error schema Type. Enforce at:
   - Compile time: `defineApiHandler` already does this via generics for users of the helper.
   - Plugin/build time: Endpoint modules that export raw handlers need validation via TypeInfoApi `assignableTo` (similar to Router's handler/params checks). Produce AVM-TC-\* diagnostics on mismatch.

2. **Coercion in HttpServerResponse**: All handler returns must be encoded via success/error schemas into proper `HttpServerResponse` (status code + body). Effect's HttpApi layer does this when success/error schemas are passed to HttpApiEndpoint—the layer requires `ErrorServicesEncode` and encodes success/error. Our responsibility: ensure we pass success/error to HttpApiEndpoint (done) and that handler types are validated.

## Current state

- **Emit**: success/error passed to HttpApiEndpoint.options ✓
- **defineApiHandler**: Compile-time typing for success/error ✓
- **Plugin structural check**: Not implemented—validateEndpointContracts only checks required exports, no assignableTo for handler vs success/error
- **Response encoding**: Delegated to Effect HttpApi layer when success/error provided ✓

## Implementation gap

Add handler/success/error structural validation in `validateEndpointContracts` or a new phase, using TypeInfoApi file/export type info and assignableTo(Schema.Type<Success>, handlerReturnType) / assignableTo(Schema.Type<Error>, handlerErrorType). Mirror Router's use of routeTypeNode and buildRouteDescriptors for handler classification.
