import { HtmlRenderEvent } from "./RenderEvent.js";

/**
 * Injects a trusted HTML string into a template without escaping it.
 *
 * Use this only for HTML that has already been sanitized or is otherwise fully
 * trusted. User-authored strings should keep using normal template interpolation.
 *
 * @since 1.0.0
 * @category rendering
 */
export const unsafeHtml = (source: string) => HtmlRenderEvent(source, true);
