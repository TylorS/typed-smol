/**
 * Bootstrap file for TypeInfoApi type target resolution in tests.
 * Exists so resolveTypeTargetsFromSpecs can find canonical Effect/Fx/RefSubject/Stream/Route types
 * when the program includes this file. Do not use; for test harness only.
 */
import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import * as Stream from "effect/Stream";
import * as Route from "@typed/router";
import * as Option from "effect/Option";
import * as Cause from "effect/Cause";
import * as Layer from "effect/Layer";
import * as ServiceMap from "effect/ServiceMap";
void Effect;
void Fx;
void RefSubject;
void Stream;
void Route;
void Option;
void Cause;
void Layer;
void ServiceMap;
export {};
