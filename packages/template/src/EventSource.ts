import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Scope from "effect/Scope";
import type { EventHandler } from "./EventHandler.js";
import { getElements, type Rendered } from "./Wire.js";

type EventName = string;

type Handler<Ev extends Event> = EventHandler<Ev>;

/**
 * An interface for managing event listeners on DOM nodes.
 *
 * It abstracts the process of adding and removing event listeners, ensuring that they are
 * properly cleaned up when the scope is closed or the element is removed.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { makeEventSource } from "@typed/template/EventSource"
 * import * as EventHandler from "@typed/template/EventHandler"
 * import { Scope } from "effect"
 *
 * const program = Effect.gen(function* () {
 *   const eventSource = makeEventSource()
 *   const button = document.createElement("button")
 *
 *   // Add event listener
 *   const handler = EventHandler.make((event: MouseEvent) => {
 *     console.log("Button clicked")
 *   })
 *
 *   const disposable = eventSource.addEventListener(button, "click", handler)
 *
 *   // Setup listeners for rendered content
 *   yield* eventSource.setup(button, yield* Scope.make())
 *
 *   // Cleanup
 *   disposable[Symbol.dispose]()
 * })
 * ```
 *
 * @since 1.0.0
 * @category models
 */
export interface EventSource {
  /**
   * Adds an event listener to a target.
   */
  readonly addEventListener: <Ev extends Event>(
    element: EventTarget,
    event: EventName,
    handler: Handler<Ev>,
  ) => Disposable;

  /**
   * Sets up event listeners for a rendered template within a scope.
   */
  readonly setup: (rendered: Rendered, scope: Scope.Scope) => Effect.Effect<void>;
}

type Entry = {
  readonly element: Element;
  readonly event: EventName;
  readonly handler: Handler<any>;
  readonly attachments: Set<Disposable>;
};

type Mount = {
  readonly elements: ReadonlyArray<Element>;
  readonly run: Run;
  readonly attachments: Map<Entry, Disposable>;
};
type Run = <E, A>(effect: Effect.Effect<A, E>) => Fiber.Fiber<A, E>;

const disposable = (f: () => void): Disposable => ({ [Symbol.dispose]: f });
const dispose = (d: Disposable): void => d[Symbol.dispose]();

/**
 * Creates a new `EventSource`.
 *
 * The created `EventSource` can efficiently manage multiple event listeners,
 * grouping them by event type and handling setup/teardown lifecycles.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { makeEventSource } from "@typed/template/EventSource"
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * const program = Effect.gen(function* () {
 *   const eventSource = makeEventSource()
 *   const element = document.createElement("div")
 *
 *   // Add multiple event listeners
 *   eventSource.addEventListener(element, "click", EventHandler.make(() => console.log("clicked")))
 *   eventSource.addEventListener(element, "mouseover", EventHandler.make(() => console.log("hovered")))
 *
 *   // Setup all listeners
 *   yield* eventSource.setup(element, yield* Scope.make())
 * })
 * ```
 *
 * @since 1.0.0
 * @category constructors
 */
export function makeEventSource(): EventSource {
  const listeners = new Map<EventName, Set<Entry>>();
  const mounts = new Set<Mount>();

  function removeEntry(entry: Entry) {
    const entries = listeners.get(entry.event);
    entries?.delete(entry);
    if (entries?.size === 0) listeners.delete(entry.event);
    for (const attachment of entry.attachments) dispose(attachment);
    entry.attachments.clear();
    for (const mount of mounts) mount.attachments.delete(entry);
  }

  function attachEntry(entry: Entry, mount: Mount): void {
    const disposables: Array<Disposable> = [];
    const { element: target, event, handler: eventHandler } = entry;

    for (const element of mount.elements) {
      const listener = (ev: Event) => {
        if (!listeners.get(event)?.has(entry)) return;
        const match = ev.target === target || target.contains(ev.target as Node);
        if (!match) return;
        if (eventHandler.options?.once === true) removeEntry(entry);
        mount.run(eventHandler.handler(proxyCurrentTarget(ev, target)));
      };
      const options = eventHandler.options;
      element.addEventListener(event, listener, {
        capture: options?.capture,
        passive: options?.passive,
        signal: options?.signal,
      });
      disposables.push(
        disposable(() => element.removeEventListener(event, listener, options?.capture)),
      );
    }

    const attachment = disposable(() => disposables.forEach(dispose));
    entry.attachments.add(attachment);
    mount.attachments.set(entry, attachment);
  }

  function addEventListener(
    element: EventTarget,
    event: EventName,
    handler: Handler<any>,
  ): Disposable {
    const entries = listeners.get(event) ?? new Set<Entry>();
    const entry: Entry = {
      element: element as Element,
      event,
      handler,
      attachments: new Set(),
    };
    if (!listeners.has(event)) listeners.set(event, entries);
    entries.add(entry);
    for (const mount of mounts) attachEntry(entry, mount);
    return disposable(() => removeEntry(entry));
  }

  function setup(rendered: Rendered, scope: Scope.Scope) {
    const elements = getElements(rendered);
    if (elements.length === 0) return Effect.void;

    const fibers = new Set<Fiber.Fiber<any, any>>();
    const run: Run = <E, A>(effect: Effect.Effect<A, E>) => {
      const fiber = Effect.runFork(effect);
      fibers.add(fiber);
      fiber.addObserver(() => fibers.delete(fiber));
      return fiber;
    };

    const mount: Mount = { elements, run, attachments: new Map() };
    mounts.add(mount);
    for (const entries of listeners.values()) {
      for (const entry of entries) attachEntry(entry, mount);
    }

    return Scope.addFinalizer(
      scope,
      Effect.suspend(() => {
        mounts.delete(mount);
        for (const attachment of mount.attachments.values()) {
          dispose(attachment);
        }
        mount.attachments.clear();
        if (fibers.size === 0) return Effect.void;
        return Fiber.interruptAll(fibers);
      }),
    );
  }

  return {
    addEventListener,
    setup,
  };
}

function proxyCurrentTarget<E extends Event>(event: E, currentTarget: Element): E {
  return new Proxy(event, {
    get(target: E, property: string | symbol) {
      if (property === "currentTarget") return currentTarget;
      const value = target[property as keyof E];
      if (typeof value === "function") return value.bind(event);
      return value;
    },
  });
}
