---
id: service
term: Service
definition: A dependency named in an Effect or Fx requirement channel and supplied at a composition boundary.
aliases: [requirement, environment]
related: [effect, effect-channels, scope]
links: [https://www.effect.website/docs/v4/requirements-management/services/]
---

Services make dependencies such as a renderer, router, repository, or configuration visible in `R`.
Providing one satisfies that requirement; it does not erase expected errors or decide the lifetime of
resources acquired to construct it. That lifetime belongs to the relevant [Scope](#scope).
