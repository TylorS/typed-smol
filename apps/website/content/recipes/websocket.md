---
slug: websocket
title: Show live WebSocket updates in Typed
summary: Adapt a browser socket to a scoped Fx, validate its messages, and separate connection policy from rendering.
---

A deployment dashboard needs to show the latest server status without polling. The browser WebSocket owns a connection; an Fx subscription owns its event listeners and closing handshake; Typed renders validated messages. This recipe uses the browser's real API, so it needs no socket wrapper package.

Start with [callback sources](/explore/building-fx). Use a socket when the server actually supports a continuing bidirectional session. For an ordinary request/response use [Fetch and schema decoding](/integrate/fetch-schema).

## Adapt a text-message protocol

This example assumes a server sends complete text status messages. It does not claim that arbitrary JSON or binary data is a status string. A clean server closure becomes a visible closed status; an abnormal closure produces a typed failure that the view turns into an offline message. The status region stays mounted until its owner removes it.

```ts
import { Data, Effect } from "effect";
import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template";

class SocketFailure extends Data.TaggedError("SocketFailure")<{
  readonly message: string;
}> {}

export const statuses = (url: string) =>
  Fx.callback<string, SocketFailure>((emit) => {
    const socket = new WebSocket(url);
    const onMessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data === "string") emit.succeed(event.data);
      else emit.fail(new SocketFailure({ message: "Expected a text status message" }));
    };
    const onError = () => {
      emit.fail(new SocketFailure({ message: "WebSocket transport failed" }));
    };
    const onClose = (event: CloseEvent) => {
      if (event.wasClean) emit.succeed("Connection closed by the server.");
      else emit.fail(new SocketFailure({ message: `Connection closed (${event.code})` }));
    };
    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);
    return Effect.sync(() => {
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
      socket.close(1000, "View closed");
    });
  });

export const DeploymentStatus = (url: string) => {
  const state = statuses(url).pipe(
    Fx.prepend("Connecting to deployment feed…"),
    Fx.catchTag("SocketFailure", (error) => Fx.succeed(`Offline: ${error.message}`)),
  );
  return html`<section aria-label="Deployment status"><output>${state}</output></section>`;
};
```

No socket opens until the render subscribes. Removing the view interrupts that subscription and requests closure. If several views subscribe independently, each opens a connection. To share one connection, move it into an application service with one owner and distribute validated state; do not let one child close a socket still used by others. Socket construction can throw before a connection exists, so application error reporting must include setup failures as well as the typed transport channel.

## Choose a protocol before adding retries

For JSON, parse and schema-decode each complete message before producing domain data. Include sequence numbers or revision IDs if reconnecting clients must detect missing updates. Retrying the transport alone cannot reconstruct messages lost while disconnected. Decide whether to request a fresh snapshot, replay from a cursor, or mark the screen stale.

The browser WebSocket API provides no receive-side backpressure. An Fx adapter does not add it: callback deliveries can overlap. A status display can coalesce to the latest value; a transaction log needs bounded buffering and an explicit overflow/replay policy. For outgoing messages check connection readiness and monitor `bufferedAmount`; do not treat `send` as confirmation that the server processed a command. See the [WebSocket API contract](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

## Test lifecycle and visible failure

Use a local test server to send a valid status, a binary message, a clean close, and an abnormal close. Assert cleanup after parent removal, then remount and count connections. Delay an old connection's final event and ensure it cannot update the replacement view.

The `DeploymentStatus` boundary turns transport failure into visible offline state and distinguishes a clean close. Test those messages separately from server status text; a quiet connection is not necessarily disconnected. Add reconnect backoff only after deciding who owns retries and how duplicate or missing messages are handled. Browser devtools' WebSocket frames view can distinguish a server that sends no data from a Typed subscription that stopped.
