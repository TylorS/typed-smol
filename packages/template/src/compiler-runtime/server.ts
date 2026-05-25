import * as Effect from "effect/Effect";
import { Fx, RefSubject } from "@typed/fx";
import * as EventHandler from "../EventHandler.js";
import { renderToString } from "../internal/encoding.js";
import { HtmlRenderEvent } from "../RenderEvent.js";
import {
  resolveServerValue,
  type RenderableKind,
  runServerSlot,
  type ServerTemplateRuntime,
} from "./renderable.js";

export type ServerChunk = ServerTextChunk | ServerSlotChunk;

export type RouteResumePayload = Readonly<Record<string, string>>;

export interface ServerTextChunk {
  readonly kind: "text";
  readonly text: string;
}

export interface ServerSlotChunk {
  readonly action?: EventHandler.EventActionDescriptor;
  readonly kind: "slot";
  readonly valueIndex: number;
  readonly valueKind: RenderableKind;
  readonly mode?: "node" | "attr" | "boolean" | "comment" | "event";
  readonly name?: string;
}

export interface ServerTemplateSpec<Values extends readonly unknown[]> {
  readonly templateHash: string;
  readonly chunks: readonly ServerChunk[];
  readonly render: (
    values: Values,
    runtime: ServerTemplateRuntime,
  ) => Fx.Fx<HtmlRenderEvent, Error, never>;
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
        Fx.collectAll(spec.render(values as unknown as Values, {})).pipe(
          Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
        ),
      );
      return events.map((event) => event.html).join("");
    },
  });
}

export function defineStaticServerTemplate(
  spec: { readonly templateHash: string; readonly html: string },
): () => CompiledServerTemplate {
  return defineServerTemplate({
    chunks: [{ kind: "text", text: spec.html }],
    render: () => Fx.succeed(HtmlRenderEvent(spec.html, true)),
    templateHash: spec.templateHash,
  });
}

export function routeResumeAttrs(payload: RouteResumePayload): string {
  return Object.entries(payload)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => ` data-${key}="${escapeAttribute(value)}"`)
    .join("");
}

export function routeResumeChunk(payload: RouteResumePayload): ServerTextChunk {
  return { kind: "text", text: routeResumeAttrs(payload) };
}

export function renderServerChunks<Values extends readonly unknown[]>(
  values: Values,
  runtime: ServerTemplateRuntime,
  chunks: readonly ServerChunk[],
): Fx.Fx<HtmlRenderEvent, Error, never> {
  return Fx.mergeOrdered(...chunks.map((chunk) => renderChunk(values, runtime, chunk)));
}

export const renderOrderedServerChunks = renderServerChunks;

function renderChunk<Values extends readonly unknown[]>(
  values: Values,
  runtime: ServerTemplateRuntime,
  chunk: ServerChunk,
): Fx.Fx<HtmlRenderEvent, Error, never> {
  if (chunk.kind === "text") return Fx.succeed(HtmlRenderEvent(chunk.text, true));
  if (chunk.mode === "attr") return renderAttributeSlot(values[chunk.valueIndex], runtime, chunk);
  if (chunk.mode === "boolean") return renderBooleanSlot(values[chunk.valueIndex], runtime, chunk);
  if (chunk.mode === "comment") return renderCommentSlot(values[chunk.valueIndex], runtime);
  if (chunk.mode === "event") return renderEventSlot(values[chunk.valueIndex], chunk);
  return runServerSlot(chunk.valueKind, values[chunk.valueIndex], runtime);
}

function renderEventSlot(
  value: unknown,
  chunk: ServerSlotChunk,
): Fx.Fx<HtmlRenderEvent, Error, never> {
  return Fx.succeed(
    HtmlRenderEvent(EventHandler.actionDataAttributeHtml(chunk.name ?? "event", value, chunk.action), true),
  );
}

function renderAttributeSlot(
  value: unknown,
  runtime: ServerTemplateRuntime,
  chunk: ServerSlotChunk,
): Fx.Fx<HtmlRenderEvent, Error, never> {
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
): Fx.Fx<HtmlRenderEvent, Error, never> {
  return Fx.fromEffect(
    Effect.map(resolveServerValue(chunk.valueKind, value, runtime), (resolved) =>
      HtmlRenderEvent(resolved ? ` ${chunk.name}` : "", true),
    ),
  );
}

function renderCommentSlot(
  value: unknown,
  runtime: ServerTemplateRuntime,
): Fx.Fx<HtmlRenderEvent, Error, never> {
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
