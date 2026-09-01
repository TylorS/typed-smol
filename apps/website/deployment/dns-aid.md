# DNS-AID deployment note

The site publishes local discovery documents for its real read-only documentation API and MCP endpoint. DNS-AID records are intentionally not claimed until the canonical domain and DNS provider are selected.

At deployment, publish records pointing to `https://tylors.github.io/typed-smol/.well-known/ard.json`, verify them from public resolvers, and then add the exact record values and verification date here.

OAuth, Auth.md, Web Bot Auth, and commerce metadata remain absent because this documentation site has no protected resource, authenticated-bot flow, or transaction flow.
