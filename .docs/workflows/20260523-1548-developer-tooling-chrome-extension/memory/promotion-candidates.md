# Promotion Candidates

- Consider promoting after T3: protocol ids should stay plain strings with branded TypeScript types; wrappers would complicate RPC serialization.
- Consider promoting after T3: creating a publishable package requires lockfile and beta publish-order updates before commit.
- Consider promoting after T3: protocol payload decode helpers should reject excess properties at bridge boundaries.
- Consider promoting after T3: HMR facts should keep template optimization separate from stateful-HMR eligibility and rejection reasons.
- Consider promoting after T3: protocol serializers should redact by descriptor before reading object values to avoid executing sensitive getters.
