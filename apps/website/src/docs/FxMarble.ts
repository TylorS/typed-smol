type TimelineEvent =
  | { readonly tag: "gap" }
  | { readonly tag: "start" }
  | { readonly tag: "value"; readonly value: string }
  | { readonly tag: "complete" }
  | { readonly tag: "error"; readonly reason?: string }
  | { readonly tag: "cancelled" };

interface FxMarbleDiagram {
  readonly title?: string;
  readonly covers: ReadonlyArray<string>;
  readonly inputs: ReadonlyArray<Timeline>;
  readonly operator: string;
  readonly inners: ReadonlyArray<Timeline>;
  readonly outputs: ReadonlyArray<Timeline>;
}

interface Timeline {
  readonly events: ReadonlyArray<TimelineEvent>;
  readonly kind: "input" | "inner" | "output";
  readonly label: string;
}

const html = (value: string): string =>
  value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });

const parseTimeline = (source: string): ReadonlyArray<TimelineEvent> =>
  source.split(/\s+/u).flatMap((token): ReadonlyArray<TimelineEvent> => {
    if (token === ".") return [{ tag: "gap" }];
    if (token === "^") return [{ tag: "start" }];
    if (token === "|") return [{ tag: "complete" }];
    if (token === "x") return [{ tag: "cancelled" }];
    if (token === "!") return [{ tag: "error" }];
    if (token.startsWith("!")) return [{ tag: "error", reason: token.slice(1) }];
    return token === "" ? [] : [{ tag: "value", value: token }];
  });

/**
 * Parse the intentionally small `fx-marble` fence grammar:
 *
 * title: optional visual caption
 * covers: comma-separated public operator names represented by this diagram
 * input [label]: timeline slots (`.` gap, `|` complete, `!reason` error, `x` cancelled)
 * operator: a readable operator label
 * inner name: a started inner Fx (`^` start marker)
 * output [label]: timeline slots
 */
const parseFxMarble = (source: string): FxMarbleDiagram | undefined => {
  let title: string | undefined;
  let covers: ReadonlyArray<string> | undefined;
  let operator: string | undefined;
  const timelines: Array<Timeline> = [];
  const timelineNames = new Set<string>();

  for (const sourceLine of source.split("\n")) {
    const line = sourceLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const match = /^(title|covers|operator|input|inner|output)(?:\s+([^:]+))?:\s*(.*)$/u.exec(
      line,
    );
    if (match === null) return undefined;

    const [, field, sourceLabel, value] = match;
    if (field === "title") {
      if (sourceLabel !== undefined || title !== undefined) return undefined;
      title = value;
      continue;
    }
    if (field === "covers") {
      if (sourceLabel !== undefined || covers !== undefined) return undefined;
      const names = [...new Set(value!.split(",").map((name) => name.trim()).filter(Boolean))];
      if (names.length === 0) return undefined;
      covers = names;
      continue;
    }
    if (field === "operator") {
      if (sourceLabel !== undefined || operator !== undefined || value === "") return undefined;
      operator = value;
      continue;
    }

    const kind = field as Timeline["kind"];
    const rawLabel = sourceLabel?.trim() || (kind === "input" ? "Input" : "Output");
    if (kind === "inner" && (sourceLabel === undefined || sourceLabel.trim() === "")) return undefined;
    const timelineName = `${kind}:${rawLabel.toLocaleLowerCase()}`;
    if (timelineNames.has(timelineName)) return undefined;
    timelineNames.add(timelineName);
    timelines.push({
      events: parseTimeline(value!),
      kind,
      label: `${rawLabel.charAt(0).toLocaleUpperCase()}${rawLabel.slice(1)}`,
    });
  }

  const inputs = timelines.filter((timeline) => timeline.kind === "input");
  const inners = timelines.filter((timeline) => timeline.kind === "inner");
  const outputs = timelines.filter((timeline) => timeline.kind === "output");
  if (inputs.length === 0 || operator === undefined || outputs.length === 0) return undefined;

  return {
    ...(title === undefined ? {} : { title }),
    covers: covers ?? [],
    inputs,
    operator,
    inners,
    outputs,
  };
};

const eventText = (event: TimelineEvent): string => {
  switch (event.tag) {
    case "gap":
      return "gap";
    case "start":
      return "start";
    case "value":
      return event.value;
    case "complete":
      return "complete";
    case "error":
      return event.reason === undefined || event.reason === "" ? "error" : `error: ${event.reason}`;
    case "cancelled":
      return "cancelled";
  }
};

const renderEvent = (event: TimelineEvent, slot: number): string => {
  const position = ` style="--fx-marble-slot: ${slot}" aria-hidden="true"`;
  switch (event.tag) {
    case "gap":
      return "";
    case "start":
      return `<span class="fx-marble__event fx-marble__event--start"${position}>^</span>`;
    case "value":
      return `<span class="fx-marble__event fx-marble__event--value"${position}>${html(event.value)}</span>`;
    case "complete":
      return `<span class="fx-marble__event fx-marble__event--complete"${position}>|</span>`;
    case "error":
      return `<span class="fx-marble__event fx-marble__event--error"${position}>!</span>`;
    case "cancelled":
      return `<span class="fx-marble__event fx-marble__event--cancelled"${position}>x</span>`;
  }
};

const renderTimeline = ({ events, kind, label }: Timeline): string => {
  const positionedEvents = events.flatMap((event, index) =>
    event.tag === "gap" ? [] : [`slot ${index + 1} ${eventText(event)}`],
  );
  const description = `${label} timeline: ${positionedEvents.join(", ") || "empty"}`;
  return `<div class="fx-marble__row fx-marble__row--${kind}" role="img" aria-label="${html(description)}"><span class="fx-marble__label">${html(label)}</span><span class="fx-marble__track">${events.map((event, index) => renderEvent(event, index + 1)).join("")}</span></div>`;
};

/**
 * Converts a static documentation fence into a semantic, CSS-only timeline.
 * Invalid fences intentionally fall back to normal code rendering.
 */
export const renderFxMarble = (source: string): string | undefined => {
  const diagram = parseFxMarble(source);
  if (diagram === undefined) return undefined;

  const caption = diagram.title ?? `Fx marble: ${diagram.operator}`;
  const timelines = [...diagram.inputs, ...diagram.inners, ...diagram.outputs];
  const steps = Math.max(1, ...timelines.map((timeline) => timeline.events.length));
  const operatorAttribute =
    diagram.covers.length === 0
      ? ""
      : ` data-fx-operators="${html(diagram.covers.join(" "))}"`;
  const coverage =
    diagram.covers.length === 0
      ? ""
      : `<span class="fx-marble__coverage" aria-label="Operators represented: ${html(diagram.covers.join(", "))}"><span class="fx-marble__coverage-label" aria-hidden="true">Operators</span>${diagram.covers.map((name) => `<code>${html(name)}</code>`).join("")}</span>`;
  return `<figure class="fx-marble"${operatorAttribute} aria-label="${html(caption)}"><figcaption><span class="fx-marble__eyebrow">Fx operator</span><span class="fx-marble__caption">${html(caption)}</span>${coverage}</figcaption><div class="fx-marble__viewport" role="group" aria-label="Timeline diagram; scroll horizontally when needed" tabindex="0"><div class="fx-marble__diagram" style="--fx-marble-steps: ${steps}">${diagram.inputs.map(renderTimeline).join("")}<div class="fx-marble__operator-row"><span class="fx-marble__label">Operator</span><span class="fx-marble__operator-track"><span class="fx-marble__operator">${html(diagram.operator)}</span></span></div>${diagram.inners.map(renderTimeline).join("")}${diagram.outputs.map(renderTimeline).join("")}</div></div></figure>`;
};
