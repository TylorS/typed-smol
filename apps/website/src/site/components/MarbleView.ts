import { RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import { Button } from "@typed/ui/Button";
import type { Effect, Scope } from "effect";
import {
  diagramSlotWidth,
  diagramTicks,
  eventText,
  tickDescription,
  type FxMarbleDiagram,
  type Timeline,
  type TimelineEvent,
} from "../../docs/MarbleDiagram.js";

export interface MarbleState {
  readonly position: number;
  readonly speed: number;
  readonly playing: boolean;
  readonly enhanced: boolean;
  readonly reducedMotion: boolean;
  readonly followRevision: number;
}

export const initialMarbleState: MarbleState = {
  position: 0,
  speed: 0.5,
  playing: false,
  enhanced: false,
  reducedMotion: false,
  followRevision: 0,
};

export interface MarbleActions {
  readonly play: Effect.Effect<void>;
  readonly restart: Effect.Effect<void>;
  readonly previous: Effect.Effect<void>;
  readonly next: Effect.Effect<void>;
  readonly seek: (tick: number) => Effect.Effect<void>;
  readonly speed: (speed: number) => Effect.Effect<void>;
  readonly attach: (
    figure: HTMLElement,
  ) => Effect.Effect<void, never, Scope.Scope>;
}

const eventGlyph = (event: Exclude<TimelineEvent, { readonly tag: "gap" }>) =>
  event.tag === "value"
    ? event.value
    : { start: "^", complete: "|", error: "!", cancelled: "x" }[event.tag];

const eventPhase = (state: MarbleState, tick: number) => {
  if (!state.enhanced) return undefined;
  const currentTick = Math.floor(state.position);
  return tick > currentTick
    ? "future"
    : tick === currentTick
      ? "current"
      : "past";
};

const timelineDescription = ({ label, events }: Timeline) => {
  const descriptions = events.flatMap((event, tick) =>
    event.tag === "gap" ? [] : [`tick ${tick} ${eventText(event)}`],
  );
  return `${label} timeline: ${descriptions.join(", ") || "empty"}`;
};

const legend = html`<details class="fx-marble__legend">
  <summary>Read this diagram</summary>
  <p>Illustrated ticks start at 0 and share one clock across every lane. Events aligned vertically happen at the same tick. Ticks show order; captions specify a duration when timing matters. At 1×, playback advances one illustrated tick per second, regardless of the caption’s real duration.</p>
  <ul>
    <li><span aria-hidden="true">○</span> a value</li>
    <li><span aria-hidden="true">^</span> work starts</li>
    <li><span aria-hidden="true">|</span> run returns</li>
    <li><span aria-hidden="true">!</span> a cause is delivered</li>
    <li><span aria-hidden="true">x</span> work is interrupted</li>
  </ul>
  <p>A cause or interruption belongs to its lane. Other work may continue. Dashed and muted events lie ahead of the playhead; scroll the diagram to inspect long timelines.</p>
</details>`;

/** Markdown and the browser render this same template and its native controls. */
export const MarbleView = (
  diagram: FxMarbleDiagram,
  state?: RefSubject.RefSubject<MarbleState>,
  actions?: MarbleActions,
) => {
  const read = <A>(project: (state: MarbleState) => A) =>
    state ? RefSubject.map(state, project) : project(initialMarbleState);
  const steps = diagramTicks(diagram);
  const lastTick = steps - 1;
  const caption = diagram.title ?? `Fx marble: ${diagram.operator}`;
  const description = read((state) =>
    tickDescription(diagram, Math.floor(state.position)),
  );
  const atStart = read((state) => state.enhanced && state.position <= 0);
  const atEnd = read((state) => state.enhanced && state.position >= lastTick);
  const singleTick = read((state) => state.enhanced && lastTick === 0);

  const timeline = (timeline: Timeline) => html`<div
    class="fx-marble__row fx-marble__row--${timeline.kind}"
    role="img" aria-label=${timelineDescription(timeline)}>
    <span class="fx-marble__label">${timeline.label}</span>
    <span class="fx-marble__track">${timeline.events.map((event, tick) =>
      event.tag === "gap"
        ? null
        : html`<span
        class="fx-marble__event fx-marble__event--${event.tag}"
        data-tick=${tick} data-description="${timeline.label}: ${eventText(event)}"
        style="--fx-marble-slot: ${tick + 1}" aria-hidden="true"
        data-phase=${read((state) => eventPhase(state, tick))}>${eventGlyph(event)}</span>`,
    )}</span>
  </div>`;

  const coverage = diagram.covers.length
    ? html`<span
    class="fx-marble__coverage"
    aria-label="Operators represented: ${diagram.covers.join(", ")}">
    <span class="fx-marble__coverage-label" aria-hidden="true">Operators</span>
    ${diagram.covers.map((name) => html`<code>${name}</code>`)}
  </span>`
    : null;

  const transport = html`<div class="fx-marble__transport" role="group" aria-label="Timeline playback">
    ${Button({
      disabled: atStart,
      content: "↤",
      onclick: actions?.restart,
      props: {
        "data-action": "restart",
        "aria-label": "Return to the first tick",
        title: "Return to the first tick",
      },
    })}
    ${Button({
      disabled: atStart,
      content: "←",
      onclick: actions?.previous,
      props: {
        "data-action": "previous",
        "aria-label": "Previous tick",
        title: "Previous tick",
      },
    })}
    ${Button({
      disabled: singleTick,
      onclick: actions?.play,
      props: { "data-action": "play", class: "fx-marble__play" },
      content: html`<span aria-hidden="true">${read((state) =>
        state.playing
          ? "Ⅱ"
          : state.position === lastTick && lastTick > 0
            ? "↻"
            : "▶",
      )}</span> <span data-play-label>${read((state) =>
        state.playing
          ? "Pause"
          : state.position === lastTick && lastTick > 0
            ? "Replay"
            : "Play",
      )}</span>`,
    })}
    ${Button({
      disabled: atEnd,
      content: "→",
      onclick: actions?.next,
      props: {
        "data-action": "next",
        "aria-label": "Next tick",
        title: "Next tick",
      },
    })}
  </div>`;

  const onSpeed =
    actions &&
    EventHandler.make((event: Event) =>
      actions.speed(Number((event.currentTarget as HTMLSelectElement).value)),
    );
  const onSeek =
    actions &&
    EventHandler.make((event: Event) =>
      actions.seek(Number((event.currentTarget as HTMLInputElement).value)),
    );

  return html`<figure class="fx-marble"
    data-fx-operators=${diagram.covers.length ? diagram.covers.join(" ") : undefined}
    aria-label=${caption}
    data-enhanced=${read((state) => (state.enhanced ? "true" : undefined))}
    data-playing=${read((state) => (state.enhanced ? String(state.playing) : undefined))}
    style=${read((state) =>
      state.enhanced
        ? `--fx-marble-time: ${state.reducedMotion ? Math.floor(state.position) : state.position}`
        : undefined,
    )} ref=${actions?.attach}>
    <figcaption>
      <span class="fx-marble__eyebrow">Fx timeline</span>
      <span class="fx-marble__caption">${caption}</span>
      ${coverage}
    </figcaption>
    <div class="fx-marble__viewport" role="group"
      aria-label="Timeline diagram; scroll horizontally when needed" tabindex="0">
      <div class="fx-marble__diagram" data-ticks=${steps}
        style="--fx-marble-steps: ${steps}; --fx-marble-slot-width: ${diagramSlotWidth(diagram)}rem">
        <div class="fx-marble__clock" aria-hidden="true">
          <span class="fx-marble__playhead"></span>
        </div>
        <div class="fx-marble__axis" aria-hidden="true">
          <span class="fx-marble__label">Tick</span>
          <span class="fx-marble__track">${Array.from(
            { length: steps },
            (_, tick) =>
              html`<span class="fx-marble__tick" style="--fx-marble-slot: ${tick + 1}">${tick}</span>`,
          )}</span>
        </div>
        ${diagram.inputs.map(timeline)}
        <div class="fx-marble__operator-row">
          <span class="fx-marble__label">Operator</span>
          <span class="fx-marble__operator-track">
            <span class="fx-marble__operator">${diagram.operator}</span>
          </span>
        </div>
        ${[...diagram.inners, ...diagram.outputs].map(timeline)}
      </div>
    </div>
    <div class="fx-marble__controls" ?hidden=${read((state) => !state.enhanced)}>
      ${transport}
      <label class="fx-marble__speed">
        <span>Speed</span>
        <select aria-label="Playback speed" .value=${read((state) => String(state.speed))} @change=${onSpeed}>
          <option value="0.25">0.25×</option>
          <option value="0.5" selected>0.5×</option>
          <option value="1">1×</option>
          <option value="2">2×</option>
        </select>
      </label>
      <div class="fx-marble__scrubber">
        <input type="range" min="0" max=${lastTick} step="1"
          .value=${read((state) => String(Math.floor(state.position)))} ?disabled=${singleTick}
          aria-label="Timeline position" aria-valuetext=${description} @input=${onSeek} />
        <output class="fx-marble__position" aria-live="off">Tick ${read((state) => Math.floor(state.position))} / ${lastTick}</output>
      </div>
      <p class="fx-marble__activity" role="status"
        aria-live=${read((state) => (state.playing ? "off" : "polite"))} aria-atomic="true">${description}</p>
    </div>
    ${legend}
  </figure>`;
};
