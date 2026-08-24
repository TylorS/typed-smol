<script>
  import { onMount } from "svelte";

  let { label, onMounted = () => {}, onDestroyed = () => {} } = $props();
  let count = $state(0);

  onMount(() => {
    onMounted();
    return onDestroyed;
  });
</script>

<svelte:head>
  <title>{label}</title>
</svelte:head>

<button data-stateful onclick={() => count++}>{label}:{count}</button>
