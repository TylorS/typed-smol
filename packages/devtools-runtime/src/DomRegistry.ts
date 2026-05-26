import {
  makeDomBindingId,
  makeTemplateHash,
  makeTemplatePartId,
  type ComponentSummary,
  type DomBindingId,
  type DomBindingRequest,
  type DomBindingResolution,
  type TemplateHash,
  type TemplatePartId,
} from "@typed/devtools-protocol";
import type {
  DomTemplateDevtoolsBindingEvent,
  DomTemplateDevtoolsMountedEvent,
  DomTemplateDevtoolsObserver,
  DomTemplateDevtoolsUnmountedEvent,
} from "@typed/template/compiler-runtime/devtools";
import * as Effect from "effect/Effect";
import type { DevtoolsRuntimeService } from "./Layer.js";

export interface DomRegistryOptions {
  readonly now?: () => number;
  readonly runtime?: DevtoolsRuntimeService;
}

export interface DomRegistry {
  readonly observer: DomTemplateDevtoolsObserver;
  readonly registerComponent: (component: ComponentSummary) => void;
  readonly resolveBindingNode: (bindingId: DomBindingId) => Node | undefined;
  readonly resolveDomBinding: (request: DomBindingRequest) => Effect.Effect<DomBindingResolution>;
  readonly resolveNode: (node: Node) => DomBindingResolution;
}

interface DomNodeRecord {
  readonly bindingId: DomBindingId;
  readonly templateHash: TemplateHash;
  readonly templatePartId?: TemplatePartId;
}

interface DomRegistryState {
  readonly bindingRecords: Map<DomBindingId, DomNodeRecord>;
  readonly componentsByTemplate: Map<TemplateHash, ComponentSummary>;
  readonly now: () => number;
  readonly nodeRecords: WeakMap<Node, DomNodeRecord>;
  readonly nodesByBinding: Map<DomBindingId, Node>;
  readonly pendingBindingsByTemplate: Map<TemplateHash, Set<PendingBindingRecord>>;
  readonly rootBindings: WeakMap<HTMLElement, Set<DomBindingId>>;
  readonly rootComponents: WeakMap<HTMLElement, ComponentSummary>;
  readonly runtime?: DevtoolsRuntimeService;
}

interface PendingBindingRecord {
  readonly bindingId: DomBindingId;
  readonly node: Node;
}

export function makeDomRegistry(options: DomRegistryOptions = {}): DomRegistry {
  const state = makeDomRegistryState(options);

  return {
    observer: makeDomRegistryObserver(state),
    registerComponent(component) {
      if (component.templateHash) state.componentsByTemplate.set(component.templateHash, component);
    },
    resolveBindingNode(bindingId) {
      return state.nodesByBinding.get(bindingId);
    },
    resolveDomBinding(request) {
      return Effect.succeed(resolveBindingRecord(state, request.bindingId));
    },
    resolveNode(node) {
      return resolveNodeRecord(state, node);
    },
  };
}

function makeDomRegistryState(options: DomRegistryOptions): DomRegistryState {
  return {
    bindingRecords: new Map(),
    componentsByTemplate: new Map(),
    now: options.now ?? Date.now,
    nodeRecords: new WeakMap(),
    nodesByBinding: new Map(),
    pendingBindingsByTemplate: new Map(),
    rootBindings: new WeakMap(),
    rootComponents: new WeakMap(),
    ...(options.runtime?.enabled ? { runtime: options.runtime } : {}),
  };
}

function makeDomRegistryObserver(state: DomRegistryState): DomTemplateDevtoolsObserver {
  return {
    onTemplateBinding(event) {
      recordTemplateBinding(state, event);
    },
    onTemplateMounted(event) {
      recordTemplateMounted(state, event);
    },
    onTemplateUnmounted(event) {
      forgetTemplateRoot(state, event);
    },
  };
}

function recordTemplateBinding(
  state: DomRegistryState,
  event: DomTemplateDevtoolsBindingEvent,
): void {
  const bindingId = makeDomBindingId(event.bindingId);
  const record = {
    bindingId,
    templateHash: makeTemplateHash(event.templateHash),
    templatePartId: templatePartIdFromBindingEvent(event),
  } satisfies DomNodeRecord;

  state.bindingRecords.set(bindingId, record);
  state.nodeRecords.set(event.node, record);
  state.nodesByBinding.set(bindingId, event.node);
  addPendingBinding(state, record.templateHash, {
    bindingId,
    node: event.node,
  });
}

function recordTemplateMounted(
  state: DomRegistryState,
  event: DomTemplateDevtoolsMountedEvent,
): void {
  const templateHash = makeTemplateHash(event.templateHash);
  const rootBindingIds = new Set<DomBindingId>();

  event.nodes.forEach((node, index) => {
    const record = rootRecord(event.templateHash, templateHash, index);
    state.bindingRecords.set(record.bindingId, record);
    state.nodeRecords.set(node, record);
    state.nodesByBinding.set(record.bindingId, node);
    rootBindingIds.add(record.bindingId);
  });

  addMountedPendingBindings(state, templateHash, event.nodes, rootBindingIds);
  state.rootBindings.set(event.root, rootBindingIds);
  recordComponentMounted(state, event.root, templateHash);
}

function forgetTemplateRoot(
  state: DomRegistryState,
  event: DomTemplateDevtoolsUnmountedEvent,
): void {
  const bindingIds = state.rootBindings.get(event.root);
  if (!bindingIds) return;
  const component = state.rootComponents.get(event.root);

  for (const bindingId of bindingIds) {
    state.bindingRecords.delete(bindingId);
    state.nodesByBinding.delete(bindingId);
  }
  state.rootBindings.delete(event.root);
  state.rootComponents.delete(event.root);
  if (component) {
    state.runtime?.emit({
      _tag: "ComponentUnmounted",
      componentId: component.componentId,
      timestamp: state.now(),
    });
  }
}

function recordComponentMounted(
  state: DomRegistryState,
  root: HTMLElement,
  templateHash: TemplateHash,
): void {
  const component = state.componentsByTemplate.get(templateHash);
  if (!component) return;
  state.rootComponents.set(root, component);
  state.runtime?.emit({ _tag: "ComponentMounted", component, timestamp: state.now() });
}

function rootRecord(
  runtimeTemplateHash: string,
  templateHash: TemplateHash,
  index: number,
): DomNodeRecord {
  return {
    bindingId: makeDomBindingId(`${runtimeTemplateHash}#root:${index}`),
    templateHash,
  };
}

function addPendingBinding(
  state: DomRegistryState,
  templateHash: TemplateHash,
  binding: PendingBindingRecord,
): void {
  const current =
    state.pendingBindingsByTemplate.get(templateHash) ?? new Set<PendingBindingRecord>();
  current.add(binding);
  state.pendingBindingsByTemplate.set(templateHash, current);
}

function addMountedPendingBindings(
  state: DomRegistryState,
  templateHash: TemplateHash,
  mountedNodes: readonly Node[],
  rootBindingIds: Set<DomBindingId>,
): void {
  const pendingBindings = state.pendingBindingsByTemplate.get(templateHash);
  if (!pendingBindings) return;

  for (const binding of Array.from(pendingBindings)) {
    if (!isNodeWithinMountedNodes(binding.node, mountedNodes)) continue;
    rootBindingIds.add(binding.bindingId);
    pendingBindings.delete(binding);
  }
  if (pendingBindings.size === 0) state.pendingBindingsByTemplate.delete(templateHash);
}

function resolveNodeRecord(state: DomRegistryState, node: Node): DomBindingResolution {
  for (let current: Node | null = node; current !== null; current = parentNodeOf(current)) {
    const record = state.nodeRecords.get(current);
    if (record && state.bindingRecords.has(record.bindingId)) {
      return resolveRecord(state, record);
    }
  }

  return unbound(makeDomBindingId("unbound-node"), "DOM node is not registered");
}

function resolveBindingRecord(
  state: DomRegistryState,
  bindingId: DomBindingId,
): DomBindingResolution {
  const record = state.bindingRecords.get(bindingId);
  if (!record) return unbound(bindingId, "DOM binding is not registered");

  return resolveRecord(state, record);
}

function resolveRecord(state: DomRegistryState, record: DomNodeRecord): DomBindingResolution {
  const component = state.componentsByTemplate.get(record.templateHash);
  if (!component) return unbound(record.bindingId, "DOM binding has no component owner");

  return {
    _tag: "Resolved",
    bindingId: record.bindingId,
    component,
    ...(record.templatePartId && { templatePartId: record.templatePartId }),
  };
}

function unbound(bindingId: DomBindingId, reason: string): DomBindingResolution {
  return { _tag: "Unbound", bindingId, reason };
}

function templatePartIdFromBindingEvent(
  event: DomTemplateDevtoolsBindingEvent,
): TemplatePartId | undefined {
  if (event.valueIndex === undefined) return undefined;
  return makeTemplatePartId(`${event.templateHash}#${pathKey(event.path)}#${event.valueIndex}`);
}

function pathKey(path: readonly number[]): string {
  return path.length === 0 ? "root" : path.join(".");
}

function isNodeWithinMountedNodes(node: Node, mountedNodes: readonly Node[]): boolean {
  for (let current: Node | null = node; current !== null; current = parentNodeOf(current)) {
    if (mountedNodes.includes(current)) return true;
  }

  return false;
}

function parentNodeOf(node: Node): Node | null {
  return node.parentNode as Node | null;
}
