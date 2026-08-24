<script>
  import { Effect } from "effect";
  import { html } from "@typed/template";
  import { attachment } from "../../lib/index.js";

  let { runtime, onAcquire = () => {}, onRelease = () => {} } = $props();
  let label = $state("one");

  const lifecycle = () =>
    Effect.acquireRelease(
      Effect.sync(onAcquire),
      () => Effect.sync(onRelease),
    ).pipe(Effect.andThen(Effect.never));

  const typedView = $derived.by(
    () => html`<span data-typed-child ref=${lifecycle}>${label}</span>`,
  );
</script>

<button data-update onclick={() => (label = "two")}>update</button>
<div data-attachment {@attach attachment(runtime, typedView)}></div>
