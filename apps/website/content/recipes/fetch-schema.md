---
slug: fetch-schema
title: Fetch and validate API data before rendering
summary: Keep network cancellation, HTTP failure, JSON parsing, and schema decoding distinct in a Typed component.
---

A project settings page requests a profile from an HTTP API. A successful `fetch` only establishes that a response arrived; it does not prove the status is successful, the body is JSON, or the JSON matches the application model. Decode at this boundary before passing data into templates.

This uses the platform Fetch API and Effect Schema already used by Typed. Add a cache library only when the application needs shared caching, invalidation, or background refresh. An Fx subscription by itself is not a request cache.

## Make the request cancellable

The request callback receives Effect's AbortSignal and passes it to `fetch`. Leaving the component interrupts the request rather than allowing a late result to update a discarded view. HTTP and decoding failures stay on the error channel.

```ts
import { Data, Effect, Schema } from "effect";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";

class ProfileRequestError extends Data.TaggedError("ProfileRequestError")<{
  readonly cause: unknown;
}> {}

const Profile = Schema.Struct({
  id: Schema.String,
  displayName: Schema.String,
});

const loadProfile = Effect.fn("loadProfile")(function* (id: string) {
  const json = yield* Effect.tryPromise({
    try: async (signal) => {
      const response = await fetch(`/api/profiles/${encodeURIComponent(id)}`, { signal });
      if (!response.ok) throw new Error(`Profile request failed (${response.status})`);
      return await response.json() as unknown;
    },
    catch: (cause) => new ProfileRequestError({ cause }),
  });
  return yield* Schema.decodeUnknownEffect(Profile)(json);
});

export const ProfileCard = component(function* (id: string) {
  const profile = yield* loadProfile(id);
  return html`<article><h2>${profile.displayName}</h2><p>Account ${profile.id}</p></article>`;
});
```

The component begins rendering its article only after the request and decode succeed. Put loading and failure UI in the owning screen; for a richer loading/refresh state model follow [AsyncData](/explore/async-data). `ProfileRequestError` deliberately groups network, HTTP, and JSON syntax failure in a transport boundary while Schema retains structural decoding errors. If the UI needs a special 404 action or retry policy, give those statuses their own error cases instead of parsing the error message.

## Choose who may share the result

One subscription to `ProfileCard` performs one request. Two independent instances may request the same profile twice. To share data, put the request state in an explicitly shared service or cache and let multiple views observe it. Include all identity inputs in a cache key—profile ID, account or tenant, and relevant query parameters. Dispose or invalidate user-specific state when the account changes.

A changing selected ID needs an explicit replacement policy. Interrupt the old component before showing the new request, or use the switching operators described in [dynamic Fx](/explore/fx-higher-order-and-concurrency). Keeping old data during refresh is a separate product choice; label its freshness instead of accidentally showing one profile under another profile's heading.

## Exercise the four failure surfaces

Test a valid response, HTTP 404, malformed JSON, and structurally invalid JSON. Then delay the response and remove the view; verify that its request signal becomes aborted. This distinguishes interruption from a server error. The [Fetch guide](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) documents why HTTP error statuses do not reject the promise automatically and how cancellation reaches body consumption.

The relative URL assumes a browser entry. Server rendering needs a request-aware absolute URL or an HTTP client service; do not guess the host from global process state. Authenticated browser requests also need the API's documented cookie/CORS contract. Treat those as deployment and server policy, then keep the template concerned with already-decoded values.
