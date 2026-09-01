import { Effect, Layer } from "effect";
import { registerWebMcp } from "./agent/WebMcp.js";
import { createOnDemandSearch } from "./search/OnDemandSearch.js";
import { searchHydration } from "./search/SearchHydration.js";

const WebMcpLive = Layer.effectDiscard(
  Effect.acquireRelease(
    Effect.sync(() => registerWebMcp(document)),
    (unregister) => Effect.sync(unregister),
  ),
);

const SearchLive = searchHydration({ document, search: createOnDemandSearch() });

Effect.runFork(Layer.launch(Layer.mergeAll(WebMcpLive, SearchLive)));
