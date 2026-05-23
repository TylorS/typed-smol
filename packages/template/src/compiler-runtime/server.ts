import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { renderToString } from "../internal/encoding.js";
import { HtmlRenderEvent } from "../RenderEvent.js";
import {
  resolveServerValue,
  type RenderableKind,
  runServerSlot,
  type ServerTemplateRuntime,
} from "./renderable.js";

export type ServerChunk = ServerTextChunk | ServerSlotChunk;

export interface ServerTextChunk {
  readonly kind: "text";
  readonly text: string;
}

export interface ServerSlotChunk {
  readonly kind: "slot";
  readonly valueIndex: number;
  readonly valueKind: RenderableKind;
  readonly mode?: "node" | "attr" | "boolean" | "comment";
  readonly name?: string;
}

export interface ServerTemplateSpec<Values extends readonly unknown[]> {
  readonly templateHash: string;
  readonly chunks: readonly ServerChunk[];
  readonly render: (
    values: Values,
    runtime: ServerTemplateRuntime,
  ) => Fx.Fx<HtmlRenderEvent, unknown, never>;
}

export interface CompiledServerTemplate {
  readonly renderToString: (values?: ArrayLike<unknown>) => Promise<string>;
}

export function defineServerTemplate<Values extends readonly unknown[]>(
  spec: ServerTemplateSpec<Values>,
): (...values: Values) => CompiledServerTemplate {
  return (...captured) => ({
    renderToString: async (values = captured) => {
      const events = await Effect.runPromise(
        Fx.collectAll(spec.render(values as unknown as Values, {})),
      );
      return events.map((event) => event.html).join("");
    },
  });
}

export function renderServerChunks<Values extends readonly unknown[]>(
  values: Values,
  runtime: ServerTemplateRuntime,
  chunks: readonly ServerChunk[],
): Fx.Fx<HtmlRenderEvent, unknown, never> {
  return Fx.mergeOrdered(...chunks.map((chunk) => renderChunk(values, runtime, chunk)));
}

function renderChunk<Values extends readonly unknown[]>(
  values: Values,
  runtime: ServerTemplateRuntime,
  chunk: ServerChunk,
): Fx.Fx<HtmlRenderEvent, unknown, never> {
  if (chunk.kind === "text") return Fx.succeed(HtmlRenderEvent(chunk.text, true));
  if (chunk.mode === "attr") return renderAttributeSlot(values[chunk.valueIndex], runtime, chunk);
  if (chunk.mode === "boolean") return renderBooleanSlot(values[chunk.valueIndex], runtime, chunk);
  if (chunk.mode === "comment") return renderCommentSlot(values[chunk.valueIndex], runtime);
  return runServerSlot(chunk.valueKind, values[chunk.valueIndex], runtime);
}

function renderAttributeSlot(
  value: unknown,
  runtime: ServerTemplateRuntime,
  chunk: ServerSlotChunk,
): Fx.Fx<HtmlRenderEvent, unknown, never> {
  return Fx.fromEffect(
    Effect.map(resolveServerValue(chunk.valueKind, value, runtime), (resolved) => {
      if (resolved === false || resolved === null || resolved === undefined) return HtmlRenderEvent("", true);
      return HtmlRenderEvent(` ${chunk.name}="${escapeAttribute(renderToString(resolved, ""))}"`, true);
    }),
  );
}

function renderBooleanSlot(
  value: unknown,
  runtime: ServerTemplateRuntime,
  chunk: ServerSlotChunk,
): Fx.Fx<HtmlRenderEvent, unknown, never> {
  return Fx.fromEffect(
    Effect.map(resolveServerValue(chunk.valueKind, value, runtime), (resolved) =>
      HtmlRenderEvent(resolved ? ` ${chunk.name}` : "", true),
    ),
  );
}

function renderCommentSlot(
  value: unknown,
  runtime: ServerTemplateRuntime,
): Fx.Fx<HtmlRenderEvent, unknown, never> {
  return Fx.fromEffect(
    Effect.map(resolveServerValue("unknown", value, runtime), (resolved) =>
      HtmlRenderEvent(escapeText(renderToString(resolved, "")), true),
    ),
  );
}

function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', "&quot;");
}
