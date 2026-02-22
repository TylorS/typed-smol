## Promotion Candidates (deferred)

- candidate:
  - "Checkpointed planning (CP-A/B/C) anchored to blocking TS scenarios improves execution reliability."
  - confidence: medium-high
  - evidence:
    - plan became dependency-aware and failure-policy explicit after applying checkpoint model.
  - decision: defer promotion until implementation run confirms checkpoint utility.

- candidate:
  - "Define unresolved vs error phase policy in planning before implementation to reduce integration churn."
  - confidence: medium
  - evidence:
    - surfaced as recurring ambiguity in specification-to-plan transition.
  - decision: defer promotion pending execution evidence.
