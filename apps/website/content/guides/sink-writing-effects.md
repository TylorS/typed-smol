---
title: "Sink: write Fx values somewhere useful"
summary: Give an Fx a typed consumer without coupling the producer to logging, storage, transport, or UI.
section: Fx
kind: guide
order: 1.16
---

An `Fx` produces values. A `Sink<A, E, R>` decides what successful values and typed failures mean
at a particular boundary. It is the smallest useful adapter for sending an Fx to a log, a queue, a
websocket, persistent storage, or another application subsystem.

Use a Sink when code should write values but should not also expose a producer or retain current
state. That is the difference from a `Subject` (both Sink and Fx) and a `RefSubject` (Sink, Fx, and
a current Effect read).

## Turn Effect callbacks into a consumer

`Sink.make(onFailure, onSuccess)` is pure. Its callbacks remain ordinary Effects, so their typed
service requirements are visible on the Sink and are provided where the producer runs.

```ts
import { Effect } from "effect"
import { Fx, Sink } from "@typed/fx"

type AuditEvent = { readonly action: string; readonly invoiceId: string }

const auditLog = Sink.make<AuditEvent>(
  (cause) => Effect.logError(cause),
  (event) => Effect.log(`audit ${event.action}: ${event.invoiceId}`),
)

const writeAudit = Fx.fromIterable<AuditEvent>([
  { action: "saved", invoiceId: "invoice-42" },
]).run(auditLog)
```

`onSuccess` runs once for every produced value. `onFailure` receives the full `Cause<E>` rather
than an erased exception, so expected failure, defects, and interruption stay distinguishable at
the boundary that reports them. `Fx.run(sink)` connects a producer to its consumer; running the
returned Effect owns the subscription and interrupts both sides together.

## Provide a named output through Effect Context

Use `Sink.Service` when independently assembled code needs the same output contract without an
imported singleton. A library can require `Audit`; the application chooses whether those events go
to structured logs, an HTTP client, or a test collector.

```ts
import { Effect } from "effect"
import { Fx, Sink } from "@typed/fx"

type AuditEvent = { readonly action: string; readonly invoiceId: string }

class Audit extends Sink.Service<Audit, AuditEvent>()("app/Audit") {}

const AuditLive = Audit.make(
  (cause) => Effect.logError(cause),
  (event) => Effect.log(`audit ${event.action}: ${event.invoiceId}`),
)

const publishAudit = Fx.fromIterable<AuditEvent>([
  { action: "saved", invoiceId: "invoice-42" },
]).run(Audit).pipe(Effect.provide(AuditLive))
```

The service class is itself the typed Sink and records `Audit` in the requirement channel. Tests
replace `AuditLive` with an in-memory Sink Layer; production installs its real destination once at
the application edge. No producer needs to know which one it received.

Continue with [Subject: publish events to many consumers](/explore/subject-event-publications) when
the same boundary must also be observed, or [Shared reactive contracts](/explore/shared-state-contracts)
to choose between service-backed Fx, Sink, Subject, and RefSubject capabilities.
