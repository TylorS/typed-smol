import type { ComponentId, DevtoolsSessionId, DomBindingId } from "./Ids.js";
import { makeComponentId, makeDomBindingId } from "./Ids.js";

const componentId: ComponentId = makeComponentId("app/root");
const domBindingId: DomBindingId = makeDomBindingId("button:submit");

// @ts-expect-error Plain strings must not satisfy branded protocol ids.
const componentFromString: ComponentId = "cmp:app/root";

// @ts-expect-error Distinct protocol id brands must not be interchangeable.
const componentFromDomBinding: ComponentId = domBindingId;

// @ts-expect-error A component id cannot stand in for a session id.
const sessionFromComponent: DevtoolsSessionId = componentId;

void componentFromString;
void componentFromDomBinding;
void sessionFromComponent;
