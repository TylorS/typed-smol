import { html } from "@typed/template/RenderTemplate";

export function host(ref: (element: HTMLElement) => unknown, content: unknown) {
  return html`<typed-svelte style="display: contents" ref=${ref}>${content}</typed-svelte>`;
}
