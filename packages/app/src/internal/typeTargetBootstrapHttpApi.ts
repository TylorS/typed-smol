/**
 * Bootstrap file for TypeInfoApi type target resolution in HttpApi tests.
 * Exists so resolveTypeTargetsFromSpecs can find canonical HttpApi/Route/Effect/Schema types
 * when the program includes this file. Do not use; for test harness only.
 */
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";
import * as HttpApiModule from "effect/unstable/httpapi/HttpApi";
import * as HttpApiGroupModule from "effect/unstable/httpapi/HttpApiGroup";
import * as HttpApiEndpointModule from "effect/unstable/httpapi/HttpApiEndpoint";
import * as HttpApiBuilderModule from "effect/unstable/httpapi/HttpApiBuilder";
import * as HttpServerResponseModule from "effect/unstable/http/HttpServerResponse";
void Effect;
void Schema;
void Route;
void HttpApiModule;
void HttpApiGroupModule;
void HttpApiEndpointModule;
void HttpApiBuilderModule;
void HttpServerResponseModule;
export {};
