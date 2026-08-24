import * as Effect from "effect/Effect";
import { fromEffect } from "@typed/fx/Fx";
import { html, type RenderEvent } from "@typed/template";
import {
  forwardHostProps,
  getProperty,
  makeInternalPropsHelpers,
  mergeProps,
  type RenderHostProps,
} from "./Props.js";
import type {
  FxInput,
  HostComponent,
  HostOptions,
  HostOverride,
  HostProps,
  HostResult,
  InternalPropsHelpers,
  RenderableInput,
} from "./Types.js";

export function renderHost<Element extends globalThis.Element>() {
  return function <
    const Options extends HostOptions<Element>,
    const Internal extends HostProps<Element>,
    const Content extends RenderableInput,
    const Fallback extends HostResult,
    const Host extends HostResult = never,
  >(
    options: Options,
    host: HostOverride<RenderHostProps<Options, Internal>, Content, Host> | undefined,
    buildInternal: (helpers: InternalPropsHelpers<Options>) => Internal,
    content: Content,
    fallback: (props: RenderHostProps<Options, Internal>, content: Content) => Fallback,
  ): HostComponent<Options | Host> {
    const props = mergeProps(
      mergeProps(getProperty(options, "props"), forwardHostProps(options)),
      buildInternal(makeInternalPropsHelpers(options)),
    );
    const rendered = host ? host(props, content) : fallback(props, content);

    return componentBoundary(rendered) as HostComponent<Options | Host>;
  };
}

export function splitRef<const Props extends { readonly ref?: unknown }>(
  props: Props,
): { readonly props: Omit<Props, "ref">; readonly ref: Props["ref"] | undefined } {
  const { ref, ...rest } = props;
  return { props: rest, ref };
}

export function renderDivHost<
  const Props extends HostProps<HTMLDivElement>,
  const Content extends RenderableInput,
>(props: Props, content: Content): HostComponent<Props | Content> {
  const split = splitRef(props);
  return html`<div ...${split.props} ref=${split.ref}>${content}</div>` as HostComponent<
    Props | Content
  >;
}

function componentBoundary(value: HostResult): FxInput<RenderEvent> {
  return (Effect.isEffect(value) ? fromEffect(value) : value) as FxInput<RenderEvent>;
}
