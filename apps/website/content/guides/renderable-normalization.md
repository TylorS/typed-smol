---
title: What a template can render
summary: See how ordinary values, Effect values, streams, arrays, and renderer output become one template part without losing errors or requirements.
section: Templates
kind: concept
order: 3.2
---

An interpolation accepts ordinary data, nested structure, an Effect value, a Stream, an `Fx`, a
`RefSubject`, or already-rendered output. The part where you interpolate it decides how it becomes
output; the template does not turn it into a component instance first.

```ts
import { Effect, Stream } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const greeting = Effect.succeed("Welcome back");
const notices = Fx.fromIterable(["First sync complete", "All changes saved"]);
const regions = Stream.fromIterable(["us-east", "eu-west"]);

export const statusPanel = html`<section>
  <h1>${greeting}</h1>
  <p>${notices}</p>
  <p>Replicas: ${regions}</p>
</section>`;
```

## The normalization matrix

The same value means different work in a node position and a named element part.

| Interpolated value | Node position | Attribute, property, class, or data part |
| --- | --- | --- |
| string, number, bigint | text | serialized value or direct property value |
| `boolean`, `null`, `undefined` | empty or text according to the part | boolean presence / remove / clear as appropriate |
| array | normalize entries in source order | normalize record entries for supported local fields |
| `Effect<A, E, R>` | run once, then normalize `A` | run once, then update the field |
| `Stream<A, E, R>` or `Fx<A, E, R>` | replace the local part per emission | update the named field per emission |
| `RefSubject<E, R>` | live state source | live state source |
| nested template / `RenderEvent` | render into this local range | use the matching part contract, not a generic attribute |

The first emitted `notices` value appears in the `<p>`, then the second replaces that same local
part. No sibling or parent tree is walked to find it. On an HTML target, a response needs a finite
answer, so live sources are read as response data rather than kept open indefinitely; see
[Rendering HTML on the server](/explore/rendering-html-on-the-server).

## Errors and requirements compose

An `Effect` is a value that can succeed, fail with an expected error, and require a service. Those
channels remain in the template's inferred type. This matters because a caller can decide at the
composition edge which real service to provide and how an expected failure becomes UI.

```ts
import { Context, Data, Effect, Layer } from "effect";
import { html } from "@typed/template";

class ProfileUnavailable extends Data.TaggedError("ProfileUnavailable")<{
  readonly userId: string;
}> {}

interface Profiles {
  readonly displayName: (userId: string) => Effect.Effect<string, ProfileUnavailable>;
}

const Profiles = Context.Service<Profiles>("Profiles");

const displayName = Effect.gen(function* () {
  const profiles = yield* Profiles;
  return yield* profiles.displayName("ada");
});

export const accountBadge = html`<p>Signed in as ${displayName}</p>`;

export const ProfilesLive = Layer.succeed(Profiles)({
  displayName: (userId) =>
    userId === "ada"
      ? Effect.succeed("Ada Lovelace")
      : Effect.fail(new ProfileUnavailable({ userId })),
});
```

`accountBadge` retains `ProfileUnavailable` and `Profiles`, rather than converting either to an
untyped promise or a hidden render-time global. Provide `ProfilesLive` with the DOM or HTML renderer
at the application boundary, not inside the template module. Effect's [services guide](https://www.effect.website/docs/v4/requirements-management/services/)
explains this dependency channel in depth.

## Arrays describe output; streams describe change

An array is recursively normalized once in its source order. It is ideal for a fixed group of child
templates. An `Fx` says a producer decides when a new value exists, so each emission updates the
one part that owns it. Mixing the two is normal: an Fx can emit an array, and the current array can
describe the current local range.

```ts
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

const shortcuts = ["Open command palette", "Toggle sidebar", "Search docs"];
const activeShortcut = Fx.fromIterable([shortcuts[0], shortcuts[1]]);

const shortcutList = shortcuts.map((shortcut) => html`<li>${shortcut}</li>`);

export const help = html`<aside>
  <p>Current shortcut: ${activeShortcut}</p>
  <ul>${shortcutList}</ul>
</aside>`;
```

The list's individual `<li>` templates are normal nested output. The current-shortcut paragraph
has one captured text part, so each `Fx` emission changes that target directly. If the list itself
can add, remove, or reorder items while mounted, use stable keys rather than treating array indexes
as identity.

## Behavior and testing

Calling `html` is inert: it starts neither an Effect nor a stream subscription. The rendering Scope
owns those subscriptions and closes them on interruption. Test the `Profiles` operation as ordinary
Effect logic first; use a DOM test only to assert that a particular part received the expected browser
value. The next guide covers the live collection case where identity—not merely a new value—matters.
