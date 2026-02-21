# Facet Classification

Generated: 2026-02-20T20:46:07.972Z

## Summary

- Submodule facets: 181
- Thematic facets: 64
- Total facets: 245

## Thematic Facets

| Parent                    | Facet               | Rationale                                 | Skill                                         |
| ------------------------- | ------------------- | ----------------------------------------- | --------------------------------------------- |
| `effect/Effect`           | `constructors`      | Creation and lifting APIs                 | `effect-facet-effect-constructors`            |
| `effect/Effect`           | `composition`       | map/flatMap/zip/all composition APIs      | `effect-facet-effect-composition`             |
| `effect/Effect`           | `error-handling`    | catch/match/retry/recover flows           | `effect-facet-effect-error-handling`          |
| `effect/Effect`           | `concurrency`       | fork/race/concurrency control             | `effect-facet-effect-concurrency`             |
| `effect/Effect`           | `resource-scope`    | scoped/acquireRelease/finalization        | `effect-facet-effect-resource-scope`          |
| `effect/Effect`           | `context-di`        | provide/service/context operations        | `effect-facet-effect-context-di`              |
| `effect/Effect`           | `execution`         | run/runSync/runPromise boundaries         | `effect-facet-effect-execution`               |
| `effect/Layer`            | `constructors`      | Layer creation APIs                       | `effect-facet-layer-constructors`             |
| `effect/Layer`            | `composition`       | merge/provide/andThen graph composition   | `effect-facet-layer-composition`              |
| `effect/Layer`            | `building`          | Layer build and runtime materialization   | `effect-facet-layer-building`                 |
| `effect/Layer`            | `memoization`       | MemoMap/fresh lifecycle behavior          | `effect-facet-layer-memoization`              |
| `effect/Stream`           | `constructors`      | stream creation APIs                      | `effect-facet-stream-constructors`            |
| `effect/Stream`           | `transforms`        | map/filter/flatMap style transforms       | `effect-facet-stream-transforms`              |
| `effect/Stream`           | `combinators`       | merge/zip/grouping composition            | `effect-facet-stream-combinators`             |
| `effect/Stream`           | `runtime`           | runCollect/runDrain/sink execution        | `effect-facet-stream-runtime`                 |
| `effect/Stream`           | `concurrency`       | buffer/share/debounce/throttle behavior   | `effect-facet-stream-concurrency`             |
| `effect/Channel`          | `core`              | core channel model and constructors       | `effect-facet-channel-core`                   |
| `effect/Channel`          | `composition`       | sequencing/transformation pipelines       | `effect-facet-channel-composition`            |
| `effect/Channel`          | `utilities`         | supportive helper operations              | `effect-facet-channel-utilities`              |
| `effect/Sink`             | `core`              | sink model and base constructors          | `effect-facet-sink-core`                      |
| `effect/Sink`             | `reducing`          | reduce/fold aggregation behavior          | `effect-facet-sink-reducing`                  |
| `effect/Sink`             | `transforms`        | mapping and composition helpers           | `effect-facet-sink-transforms`                |
| `effect/Schema`           | `core`              | schema model and constructors             | `effect-facet-schema-core`                    |
| `effect/Schema`           | `decoding`          | decode and parse pathways                 | `effect-facet-schema-decoding`                |
| `effect/Schema`           | `encoding`          | encode and serialization pathways         | `effect-facet-schema-encoding`                |
| `effect/Schema`           | `checks`            | validation/refinement checks              | `effect-facet-schema-checks`                  |
| `effect/Schema`           | `composition`       | struct/union/record/tuple composition     | `effect-facet-schema-composition`             |
| `effect/Schedule`         | `constructors`      | schedule constructors and seeds           | `effect-facet-schedule-constructors`          |
| `effect/Schedule`         | `combinators`       | compose/andThen/while/until behavior      | `effect-facet-schedule-combinators`           |
| `effect/Schedule`         | `collecting`        | input/output collection operators         | `effect-facet-schedule-collecting`            |
| `effect/Schedule`         | `timing-strategies` | jitter/delay/window timing controls       | `effect-facet-schedule-timing-strategies`     |
| `effect/Fiber`            | `lifecycle`         | join/interrupt/await lifecycle controls   | `effect-facet-fiber-lifecycle`                |
| `effect/Fiber`            | `status`            | fiber status and introspection APIs       | `effect-facet-fiber-status`                   |
| `effect/Fiber`            | `collections`       | FiberMap/FiberSet/FiberHandle patterns    | `effect-facet-fiber-collections`              |
| `effect/Scope`            | `creation`          | scope creation and provisioning           | `effect-facet-scope-creation`                 |
| `effect/Scope`            | `finalization`      | finalizer registration and close behavior | `effect-facet-scope-finalization`             |
| `effect/Scope`            | `state-management`  | scope state model and transitions         | `effect-facet-scope-state-management`         |
| `effect/Function`         | `core`              | pipe/dual/core function tools             | `effect-facet-function-core`                  |
| `effect/Function`         | `composition`       | flow/compose style combinators            | `effect-facet-function-composition`           |
| `effect/Function`         | `constants`         | constant helper functions                 | `effect-facet-function-constants`             |
| `effect/Match`            | `core`              | matcher model and constructors            | `effect-facet-match-core`                     |
| `effect/Match`            | `combinators`       | when/whenOr/whenAnd operators             | `effect-facet-match-combinators`              |
| `effect/Match`            | `discriminators`    | tag/discriminator matching APIs           | `effect-facet-match-discriminators`           |
| `effect/Match`            | `predicates`        | predicate-driven matching                 | `effect-facet-match-predicates`               |
| `effect/Predicate`        | `core`              | predicate/refinement base types           | `effect-facet-predicate-core`                 |
| `effect/Predicate`        | `guards`            | runtime type guard helpers                | `effect-facet-predicate-guards`               |
| `effect/Predicate`        | `combinators`       | logical predicate composition             | `effect-facet-predicate-combinators`          |
| `effect/Option`           | `core`              | option model and constructors             | `effect-facet-option-core`                    |
| `effect/Option`           | `combinators`       | map/flatMap/filter operations             | `effect-facet-option-combinators`             |
| `effect/Option`           | `conversions`       | interop and fallback conversions          | `effect-facet-option-conversions`             |
| `effect/Result`           | `core`              | result model and constructors             | `effect-facet-result-core`                    |
| `effect/Result`           | `combinators`       | map/flatMap/match operations              | `effect-facet-result-combinators`             |
| `effect/Result`           | `conversions`       | interop and fallback conversions          | `effect-facet-result-conversions`             |
| `effect/unstable/cluster` | `core`              | entity/shard core domain                  | `effect-facet-unstable-cluster-core`          |
| `effect/unstable/cluster` | `runners`           | runner fleet execution domain             | `effect-facet-unstable-cluster-runners-theme` |
| `effect/unstable/cluster` | `storage`           | message/runner storage backends           | `effect-facet-unstable-cluster-storage`       |
| `effect/unstable/cluster` | `proxies`           | entity proxy and resource shims           | `effect-facet-unstable-cluster-proxies`       |
| `effect/unstable/cluster` | `workflow`          | cluster workflow engine integration       | `effect-facet-unstable-cluster-workflow`      |
| `effect/unstable/cluster` | `utilities`         | support utilities and ids                 | `effect-facet-unstable-cluster-utilities`     |
| `effect/unstable/http`    | `core`              | client and server core APIs               | `effect-facet-unstable-http-core`             |
| `effect/unstable/http`    | `middleware`        | middleware/effect/tracing glue            | `effect-facet-unstable-http-middleware`       |
| `effect/unstable/http`    | `router`            | routing and method template surfaces      | `effect-facet-unstable-http-router`           |
| `effect/unstable/http`    | `utilities`         | headers/cookies/body/multipart helpers    | `effect-facet-unstable-http-utilities`        |
| `effect/unstable/http`    | `client-impl`       | specific client implementation adapters   | `effect-facet-unstable-http-client-impl`      |

## Submodule Facets

All testing and unstable submodule exports are treated as facet skills to maximize granularity and reduce scope blur.

| Import Path                                         | Parent                          | Skill                                                     |
| --------------------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `effect/testing/FastCheck`                          | `effect/testing`                | `effect-facet-testing-fastcheck`                          |
| `effect/testing/TestClock`                          | `effect/testing`                | `effect-facet-testing-testclock`                          |
| `effect/testing/TestConsole`                        | `effect/testing`                | `effect-facet-testing-testconsole`                        |
| `effect/testing/TestSchema`                         | `effect/testing`                | `effect-facet-testing-testschema`                         |
| `effect/unstable/ai/AiError`                        | `effect/unstable/ai`            | `effect-facet-unstable-ai-aierror`                        |
| `effect/unstable/ai/AnthropicStructuredOutput`      | `effect/unstable/ai`            | `effect-facet-unstable-ai-anthropicstructuredoutput`      |
| `effect/unstable/ai/Chat`                           | `effect/unstable/ai`            | `effect-facet-unstable-ai-chat`                           |
| `effect/unstable/ai/IdGenerator`                    | `effect/unstable/ai`            | `effect-facet-unstable-ai-idgenerator`                    |
| `effect/unstable/ai/LanguageModel`                  | `effect/unstable/ai`            | `effect-facet-unstable-ai-languagemodel`                  |
| `effect/unstable/ai/McpSchema`                      | `effect/unstable/ai`            | `effect-facet-unstable-ai-mcpschema`                      |
| `effect/unstable/ai/McpServer`                      | `effect/unstable/ai`            | `effect-facet-unstable-ai-mcpserver`                      |
| `effect/unstable/ai/Model`                          | `effect/unstable/ai`            | `effect-facet-unstable-ai-model`                          |
| `effect/unstable/ai/OpenAiStructuredOutput`         | `effect/unstable/ai`            | `effect-facet-unstable-ai-openaistructuredoutput`         |
| `effect/unstable/ai/Prompt`                         | `effect/unstable/ai`            | `effect-facet-unstable-ai-prompt`                         |
| `effect/unstable/ai/Response`                       | `effect/unstable/ai`            | `effect-facet-unstable-ai-response`                       |
| `effect/unstable/ai/Telemetry`                      | `effect/unstable/ai`            | `effect-facet-unstable-ai-telemetry`                      |
| `effect/unstable/ai/Tokenizer`                      | `effect/unstable/ai`            | `effect-facet-unstable-ai-tokenizer`                      |
| `effect/unstable/ai/Tool`                           | `effect/unstable/ai`            | `effect-facet-unstable-ai-tool`                           |
| `effect/unstable/ai/Toolkit`                        | `effect/unstable/ai`            | `effect-facet-unstable-ai-toolkit`                        |
| `effect/unstable/cli/Argument`                      | `effect/unstable/cli`           | `effect-facet-unstable-cli-argument`                      |
| `effect/unstable/cli/CliError`                      | `effect/unstable/cli`           | `effect-facet-unstable-cli-clierror`                      |
| `effect/unstable/cli/CliOutput`                     | `effect/unstable/cli`           | `effect-facet-unstable-cli-clioutput`                     |
| `effect/unstable/cli/Command`                       | `effect/unstable/cli`           | `effect-facet-unstable-cli-command`                       |
| `effect/unstable/cli/Flag`                          | `effect/unstable/cli`           | `effect-facet-unstable-cli-flag`                          |
| `effect/unstable/cli/HelpDoc`                       | `effect/unstable/cli`           | `effect-facet-unstable-cli-helpdoc`                       |
| `effect/unstable/cli/Param`                         | `effect/unstable/cli`           | `effect-facet-unstable-cli-param`                         |
| `effect/unstable/cli/Primitive`                     | `effect/unstable/cli`           | `effect-facet-unstable-cli-primitive`                     |
| `effect/unstable/cli/Prompt`                        | `effect/unstable/cli`           | `effect-facet-unstable-cli-prompt`                        |
| `effect/unstable/cluster/ClusterCron`               | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-clustercron`               |
| `effect/unstable/cluster/ClusterError`              | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-clustererror`              |
| `effect/unstable/cluster/ClusterMetrics`            | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-clustermetrics`            |
| `effect/unstable/cluster/ClusterSchema`             | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-clusterschema`             |
| `effect/unstable/cluster/ClusterWorkflowEngine`     | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-clusterworkflowengine`     |
| `effect/unstable/cluster/DeliverAt`                 | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-deliverat`                 |
| `effect/unstable/cluster/Entity`                    | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-entity`                    |
| `effect/unstable/cluster/EntityAddress`             | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-entityaddress`             |
| `effect/unstable/cluster/EntityId`                  | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-entityid`                  |
| `effect/unstable/cluster/EntityProxy`               | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-entityproxy`               |
| `effect/unstable/cluster/EntityProxyServer`         | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-entityproxyserver`         |
| `effect/unstable/cluster/EntityResource`            | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-entityresource`            |
| `effect/unstable/cluster/EntityType`                | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-entitytype`                |
| `effect/unstable/cluster/Envelope`                  | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-envelope`                  |
| `effect/unstable/cluster/HttpRunner`                | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-httprunner`                |
| `effect/unstable/cluster/K8sHttpClient`             | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-k8shttpclient`             |
| `effect/unstable/cluster/MachineId`                 | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-machineid`                 |
| `effect/unstable/cluster/Message`                   | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-message`                   |
| `effect/unstable/cluster/MessageStorage`            | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-messagestorage`            |
| `effect/unstable/cluster/Reply`                     | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-reply`                     |
| `effect/unstable/cluster/Runner`                    | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-runner`                    |
| `effect/unstable/cluster/RunnerAddress`             | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-runneraddress`             |
| `effect/unstable/cluster/RunnerHealth`              | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-runnerhealth`              |
| `effect/unstable/cluster/Runners`                   | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-runners`                   |
| `effect/unstable/cluster/RunnerServer`              | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-runnerserver`              |
| `effect/unstable/cluster/RunnerStorage`             | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-runnerstorage`             |
| `effect/unstable/cluster/ShardId`                   | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-shardid`                   |
| `effect/unstable/cluster/Sharding`                  | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-sharding`                  |
| `effect/unstable/cluster/ShardingConfig`            | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-shardingconfig`            |
| `effect/unstable/cluster/ShardingRegistrationEvent` | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-shardingregistrationevent` |
| `effect/unstable/cluster/SingleRunner`              | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-singlerunner`              |
| `effect/unstable/cluster/Singleton`                 | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-singleton`                 |
| `effect/unstable/cluster/SingletonAddress`          | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-singletonaddress`          |
| `effect/unstable/cluster/Snowflake`                 | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-snowflake`                 |
| `effect/unstable/cluster/SocketRunner`              | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-socketrunner`              |
| `effect/unstable/cluster/SqlMessageStorage`         | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-sqlmessagestorage`         |
| `effect/unstable/cluster/SqlRunnerStorage`          | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-sqlrunnerstorage`          |
| `effect/unstable/cluster/TestRunner`                | `effect/unstable/cluster`       | `effect-facet-unstable-cluster-testrunner`                |
| `effect/unstable/devtools/DevTools`                 | `effect/unstable/devtools`      | `effect-facet-unstable-devtools-devtools`                 |
| `effect/unstable/devtools/DevToolsClient`           | `effect/unstable/devtools`      | `effect-facet-unstable-devtools-devtoolsclient`           |
| `effect/unstable/devtools/DevToolsSchema`           | `effect/unstable/devtools`      | `effect-facet-unstable-devtools-devtoolsschema`           |
| `effect/unstable/devtools/DevToolsServer`           | `effect/unstable/devtools`      | `effect-facet-unstable-devtools-devtoolsserver`           |
| `effect/unstable/encoding/Msgpack`                  | `effect/unstable/encoding`      | `effect-facet-unstable-encoding-msgpack`                  |
| `effect/unstable/encoding/Ndjson`                   | `effect/unstable/encoding`      | `effect-facet-unstable-encoding-ndjson`                   |
| `effect/unstable/encoding/Sse`                      | `effect/unstable/encoding`      | `effect-facet-unstable-encoding-sse`                      |
| `effect/unstable/eventlog/Event`                    | `effect/unstable/eventlog`      | `effect-facet-unstable-eventlog-event`                    |
| `effect/unstable/eventlog/EventGroup`               | `effect/unstable/eventlog`      | `effect-facet-unstable-eventlog-eventgroup`               |
| `effect/unstable/eventlog/EventJournal`             | `effect/unstable/eventlog`      | `effect-facet-unstable-eventlog-eventjournal`             |
| `effect/unstable/eventlog/EventLog`                 | `effect/unstable/eventlog`      | `effect-facet-unstable-eventlog-eventlog`                 |
| `effect/unstable/eventlog/EventLogEncryption`       | `effect/unstable/eventlog`      | `effect-facet-unstable-eventlog-eventlogencryption`       |
| `effect/unstable/eventlog/EventLogRemote`           | `effect/unstable/eventlog`      | `effect-facet-unstable-eventlog-eventlogremote`           |
| `effect/unstable/eventlog/EventLogServer`           | `effect/unstable/eventlog`      | `effect-facet-unstable-eventlog-eventlogserver`           |
| `effect/unstable/eventlog/SqlEventLogJournal`       | `effect/unstable/eventlog`      | `effect-facet-unstable-eventlog-sqleventlogjournal`       |
| `effect/unstable/eventlog/SqlEventLogServer`        | `effect/unstable/eventlog`      | `effect-facet-unstable-eventlog-sqleventlogserver`        |
| `effect/unstable/http/Cookies`                      | `effect/unstable/http`          | `effect-facet-unstable-http-cookies`                      |
| `effect/unstable/http/Etag`                         | `effect/unstable/http`          | `effect-facet-unstable-http-etag`                         |
| `effect/unstable/http/FetchHttpClient`              | `effect/unstable/http`          | `effect-facet-unstable-http-fetchhttpclient`              |
| `effect/unstable/http/FindMyWay`                    | `effect/unstable/http`          | `effect-facet-unstable-http-findmyway`                    |
| `effect/unstable/http/Headers`                      | `effect/unstable/http`          | `effect-facet-unstable-http-headers`                      |
| `effect/unstable/http/HttpBody`                     | `effect/unstable/http`          | `effect-facet-unstable-http-httpbody`                     |
| `effect/unstable/http/HttpClient`                   | `effect/unstable/http`          | `effect-facet-unstable-http-httpclient`                   |
| `effect/unstable/http/HttpClientError`              | `effect/unstable/http`          | `effect-facet-unstable-http-httpclienterror`              |
| `effect/unstable/http/HttpClientRequest`            | `effect/unstable/http`          | `effect-facet-unstable-http-httpclientrequest`            |
| `effect/unstable/http/HttpClientResponse`           | `effect/unstable/http`          | `effect-facet-unstable-http-httpclientresponse`           |
| `effect/unstable/http/HttpEffect`                   | `effect/unstable/http`          | `effect-facet-unstable-http-httpeffect`                   |
| `effect/unstable/http/HttpIncomingMessage`          | `effect/unstable/http`          | `effect-facet-unstable-http-httpincomingmessage`          |
| `effect/unstable/http/HttpMethod`                   | `effect/unstable/http`          | `effect-facet-unstable-http-httpmethod`                   |
| `effect/unstable/http/HttpMiddleware`               | `effect/unstable/http`          | `effect-facet-unstable-http-httpmiddleware`               |
| `effect/unstable/http/HttpPlatform`                 | `effect/unstable/http`          | `effect-facet-unstable-http-httpplatform`                 |
| `effect/unstable/http/HttpRouter`                   | `effect/unstable/http`          | `effect-facet-unstable-http-httprouter`                   |
| `effect/unstable/http/HttpServer`                   | `effect/unstable/http`          | `effect-facet-unstable-http-httpserver`                   |
| `effect/unstable/http/HttpServerError`              | `effect/unstable/http`          | `effect-facet-unstable-http-httpservererror`              |
| `effect/unstable/http/HttpServerRequest`            | `effect/unstable/http`          | `effect-facet-unstable-http-httpserverrequest`            |
| `effect/unstable/http/HttpServerRespondable`        | `effect/unstable/http`          | `effect-facet-unstable-http-httpserverrespondable`        |
| `effect/unstable/http/HttpServerResponse`           | `effect/unstable/http`          | `effect-facet-unstable-http-httpserverresponse`           |
| `effect/unstable/http/HttpTraceContext`             | `effect/unstable/http`          | `effect-facet-unstable-http-httptracecontext`             |
| `effect/unstable/http/Multipart`                    | `effect/unstable/http`          | `effect-facet-unstable-http-multipart`                    |
| `effect/unstable/http/Multipasta`                   | `effect/unstable/http`          | `effect-facet-unstable-http-multipasta`                   |
| `effect/unstable/http/Template`                     | `effect/unstable/http`          | `effect-facet-unstable-http-template`                     |
| `effect/unstable/http/UrlParams`                    | `effect/unstable/http`          | `effect-facet-unstable-http-urlparams`                    |
| `effect/unstable/httpapi/HttpApi`                   | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapi`                   |
| `effect/unstable/httpapi/HttpApiBuilder`            | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapibuilder`            |
| `effect/unstable/httpapi/HttpApiClient`             | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapiclient`             |
| `effect/unstable/httpapi/HttpApiEndpoint`           | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapiendpoint`           |
| `effect/unstable/httpapi/HttpApiError`              | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapierror`              |
| `effect/unstable/httpapi/HttpApiGroup`              | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapigroup`              |
| `effect/unstable/httpapi/HttpApiMiddleware`         | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapimiddleware`         |
| `effect/unstable/httpapi/HttpApiScalar`             | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapiscalar`             |
| `effect/unstable/httpapi/HttpApiSchema`             | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapischema`             |
| `effect/unstable/httpapi/HttpApiSecurity`           | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapisecurity`           |
| `effect/unstable/httpapi/HttpApiSwagger`            | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-httpapiswagger`            |
| `effect/unstable/httpapi/OpenApi`                   | `effect/unstable/httpapi`       | `effect-facet-unstable-httpapi-openapi`                   |
| `effect/unstable/observability/Otlp`                | `effect/unstable/observability` | `effect-facet-unstable-observability-otlp`                |
| `effect/unstable/observability/OtlpExporter`        | `effect/unstable/observability` | `effect-facet-unstable-observability-otlpexporter`        |
| `effect/unstable/observability/OtlpLogger`          | `effect/unstable/observability` | `effect-facet-unstable-observability-otlplogger`          |
| `effect/unstable/observability/OtlpMetrics`         | `effect/unstable/observability` | `effect-facet-unstable-observability-otlpmetrics`         |
| `effect/unstable/observability/OtlpResource`        | `effect/unstable/observability` | `effect-facet-unstable-observability-otlpresource`        |
| `effect/unstable/observability/OtlpSerialization`   | `effect/unstable/observability` | `effect-facet-unstable-observability-otlpserialization`   |
| `effect/unstable/observability/OtlpTracer`          | `effect/unstable/observability` | `effect-facet-unstable-observability-otlptracer`          |
| `effect/unstable/observability/PrometheusMetrics`   | `effect/unstable/observability` | `effect-facet-unstable-observability-prometheusmetrics`   |
| `effect/unstable/persistence/KeyValueStore`         | `effect/unstable/persistence`   | `effect-facet-unstable-persistence-keyvaluestore`         |
| `effect/unstable/persistence/Persistable`           | `effect/unstable/persistence`   | `effect-facet-unstable-persistence-persistable`           |
| `effect/unstable/persistence/PersistedCache`        | `effect/unstable/persistence`   | `effect-facet-unstable-persistence-persistedcache`        |
| `effect/unstable/persistence/PersistedQueue`        | `effect/unstable/persistence`   | `effect-facet-unstable-persistence-persistedqueue`        |
| `effect/unstable/persistence/Persistence`           | `effect/unstable/persistence`   | `effect-facet-unstable-persistence-persistence`           |
| `effect/unstable/persistence/RateLimiter`           | `effect/unstable/persistence`   | `effect-facet-unstable-persistence-ratelimiter`           |
| `effect/unstable/persistence/Redis`                 | `effect/unstable/persistence`   | `effect-facet-unstable-persistence-redis`                 |
| `effect/unstable/process/ChildProcess`              | `effect/unstable/process`       | `effect-facet-unstable-process-childprocess`              |
| `effect/unstable/process/ChildProcessSpawner`       | `effect/unstable/process`       | `effect-facet-unstable-process-childprocessspawner`       |
| `effect/unstable/reactivity/AsyncResult`            | `effect/unstable/reactivity`    | `effect-facet-unstable-reactivity-asyncresult`            |
| `effect/unstable/reactivity/Atom`                   | `effect/unstable/reactivity`    | `effect-facet-unstable-reactivity-atom`                   |
| `effect/unstable/reactivity/AtomHttpApi`            | `effect/unstable/reactivity`    | `effect-facet-unstable-reactivity-atomhttpapi`            |
| `effect/unstable/reactivity/AtomRef`                | `effect/unstable/reactivity`    | `effect-facet-unstable-reactivity-atomref`                |
| `effect/unstable/reactivity/AtomRegistry`           | `effect/unstable/reactivity`    | `effect-facet-unstable-reactivity-atomregistry`           |
| `effect/unstable/reactivity/AtomRpc`                | `effect/unstable/reactivity`    | `effect-facet-unstable-reactivity-atomrpc`                |
| `effect/unstable/reactivity/Hydration`              | `effect/unstable/reactivity`    | `effect-facet-unstable-reactivity-hydration`              |
| `effect/unstable/reactivity/Reactivity`             | `effect/unstable/reactivity`    | `effect-facet-unstable-reactivity-reactivity`             |
| `effect/unstable/rpc/Rpc`                           | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpc`                           |
| `effect/unstable/rpc/RpcClient`                     | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpcclient`                     |
| `effect/unstable/rpc/RpcClientError`                | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpcclienterror`                |
| `effect/unstable/rpc/RpcGroup`                      | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpcgroup`                      |
| `effect/unstable/rpc/RpcMessage`                    | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpcmessage`                    |
| `effect/unstable/rpc/RpcMiddleware`                 | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpcmiddleware`                 |
| `effect/unstable/rpc/RpcSchema`                     | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpcschema`                     |
| `effect/unstable/rpc/RpcSerialization`              | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpcserialization`              |
| `effect/unstable/rpc/RpcServer`                     | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpcserver`                     |
| `effect/unstable/rpc/RpcTest`                       | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpctest`                       |
| `effect/unstable/rpc/RpcWorker`                     | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-rpcworker`                     |
| `effect/unstable/rpc/Utils`                         | `effect/unstable/rpc`           | `effect-facet-unstable-rpc-utils`                         |
| `effect/unstable/schema/Model`                      | `effect/unstable/schema`        | `effect-facet-unstable-schema-model`                      |
| `effect/unstable/schema/VariantSchema`              | `effect/unstable/schema`        | `effect-facet-unstable-schema-variantschema`              |
| `effect/unstable/socket/Socket`                     | `effect/unstable/socket`        | `effect-facet-unstable-socket-socket`                     |
| `effect/unstable/socket/SocketServer`               | `effect/unstable/socket`        | `effect-facet-unstable-socket-socketserver`               |
| `effect/unstable/sql/Migrator`                      | `effect/unstable/sql`           | `effect-facet-unstable-sql-migrator`                      |
| `effect/unstable/sql/SqlClient`                     | `effect/unstable/sql`           | `effect-facet-unstable-sql-sqlclient`                     |
| `effect/unstable/sql/SqlConnection`                 | `effect/unstable/sql`           | `effect-facet-unstable-sql-sqlconnection`                 |
| `effect/unstable/sql/SqlError`                      | `effect/unstable/sql`           | `effect-facet-unstable-sql-sqlerror`                      |
| `effect/unstable/sql/SqlModel`                      | `effect/unstable/sql`           | `effect-facet-unstable-sql-sqlmodel`                      |
| `effect/unstable/sql/SqlResolver`                   | `effect/unstable/sql`           | `effect-facet-unstable-sql-sqlresolver`                   |
| `effect/unstable/sql/SqlSchema`                     | `effect/unstable/sql`           | `effect-facet-unstable-sql-sqlschema`                     |
| `effect/unstable/sql/SqlStream`                     | `effect/unstable/sql`           | `effect-facet-unstable-sql-sqlstream`                     |
| `effect/unstable/sql/Statement`                     | `effect/unstable/sql`           | `effect-facet-unstable-sql-statement`                     |
| `effect/unstable/workers/Transferable`              | `effect/unstable/workers`       | `effect-facet-unstable-workers-transferable`              |
| `effect/unstable/workers/Worker`                    | `effect/unstable/workers`       | `effect-facet-unstable-workers-worker`                    |
| `effect/unstable/workers/WorkerError`               | `effect/unstable/workers`       | `effect-facet-unstable-workers-workererror`               |
| `effect/unstable/workers/WorkerRunner`              | `effect/unstable/workers`       | `effect-facet-unstable-workers-workerrunner`              |
| `effect/unstable/workflow/Activity`                 | `effect/unstable/workflow`      | `effect-facet-unstable-workflow-activity`                 |
| `effect/unstable/workflow/DurableClock`             | `effect/unstable/workflow`      | `effect-facet-unstable-workflow-durableclock`             |
| `effect/unstable/workflow/DurableDeferred`          | `effect/unstable/workflow`      | `effect-facet-unstable-workflow-durabledeferred`          |
| `effect/unstable/workflow/Workflow`                 | `effect/unstable/workflow`      | `effect-facet-unstable-workflow-workflow`                 |
| `effect/unstable/workflow/WorkflowEngine`           | `effect/unstable/workflow`      | `effect-facet-unstable-workflow-workflowengine`           |
| `effect/unstable/workflow/WorkflowProxy`            | `effect/unstable/workflow`      | `effect-facet-unstable-workflow-workflowproxy`            |
| `effect/unstable/workflow/WorkflowProxyServer`      | `effect/unstable/workflow`      | `effect-facet-unstable-workflow-workflowproxyserver`      |
