# API Reference: effect/Metric

- Import path: `effect/Metric`
- Source file: `packages/effect/src/Metric.ts`
- Function exports (callable): 20
- Non-function exports: 22

## Purpose

The `Metric` module provides a comprehensive system for collecting, aggregating, and observing application metrics in Effect applications. It offers type-safe, concurrent metrics that can be used to monitor performance, track business metrics, and gain insights into application behavior.

## Key Function Exports

- `boundariesFromIterable`
- `counter`
- `disableRuntimeMetrics`
- `enableRuntimeMetrics`
- `exponentialBoundaries`
- `frequency`
- `gauge`
- `histogram`
- `isMetric`
- `linearBoundaries`
- `mapInput`
- `modify`
- `snapshotUnsafe`
- `summary`
- `summaryWithTimestamp`
- `timer`
- `update`
- `value`

## All Function Signatures

```ts
export declare const boundariesFromIterable: (iterable: Iterable<number>): ReadonlyArray<number>;
export declare const counter: (name: string, options?: { readonly description?: string | undefined; readonly attributes?: Metric.Attributes | undefined; readonly bigint?: false | undefined; readonly incremental?: boolean | undefined; }): Counter<number>; // overload 1
export declare const counter: (name: string, options: { readonly description?: string | undefined; readonly attributes?: Metric.Attributes | undefined; readonly bigint: true; readonly incremental?: boolean | undefined; }): Counter<bigint>; // overload 2
export declare const disableRuntimeMetrics: <A, E, R>(self: Effect<A, E, R>): Effect<A, E, R>;
export declare const enableRuntimeMetrics: <A, E, R>(self: Effect<A, E, R>): Effect<A, E, R>;
export declare const exponentialBoundaries: (options: { readonly start: number; readonly factor: number; readonly count: number; }): ReadonlyArray<number>;
export declare const frequency: (name: string, options?: { readonly description?: string | undefined; readonly attributes?: Metric.Attributes | undefined; readonly preregisteredWords?: ReadonlyArray<string> | undefined; }): Frequency;
export declare const gauge: (name: string, options?: { readonly description?: string | undefined; readonly attributes?: Metric.Attributes | undefined; readonly bigint?: false | undefined; }): Gauge<number>; // overload 1
export declare const gauge: (name: string, options: { readonly description?: string | undefined; readonly attributes?: Metric.Attributes | undefined; readonly bigint: true; }): Gauge<bigint>; // overload 2
export declare const histogram: (name: string, options: { readonly description?: string | undefined; readonly attributes?: Metric.Attributes | undefined; readonly boundaries: ReadonlyArray<number>; }): Histogram<number>;
export declare const isMetric: (u: unknown): u is Metric<unknown, never>;
export declare const linearBoundaries: (options: { readonly start: number; readonly width: number; readonly count: number; }): ReadonlyArray<number>;
export declare const mapInput: <Input, Input2 extends Input>(f: (input: Input2, context: ServiceMap.ServiceMap<never>) => Input): <State>(self: Metric<Input, State>) => Metric<Input2, State>; // overload 1
export declare const mapInput: <Input, State, Input2>(self: Metric<Input, State>, f: (input: Input2, context: ServiceMap.ServiceMap<never>) => Input): Metric<Input2, State>; // overload 2
export declare const modify: <Input>(input: Input): <State>(self: Metric<Input, State>) => Effect<void>; // overload 1
export declare const modify: <Input, State>(self: Metric<Input, State>, input: Input): Effect<void>; // overload 2
export declare const snapshotUnsafe: (services: ServiceMap.ServiceMap<never>): ReadonlyArray<Metric.Snapshot>;
export declare const summary: (name: string, options: { readonly description?: string | undefined; readonly attributes?: Metric.Attributes | undefined; readonly maxAge: Duration.Input; readonly maxSize: number; readonly quantiles: ReadonlyArray<number>; }): Summary<number>;
export declare const summaryWithTimestamp: (name: string, options: { readonly description?: string | undefined; readonly attributes?: Metric.Attributes | undefined; readonly maxAge: Duration.Input; readonly maxSize: number; readonly quantiles: ReadonlyArray<number>; }): Summary<[value: number, timestamp: number]>;
export declare const timer: (name: string, options?: { readonly description?: string | undefined; readonly attributes?: Metric.Attributes | undefined; readonly boundaries?: ReadonlyArray<number>; }): Histogram<Duration.Duration>;
export declare const update: <Input>(input: Input): <State>(self: Metric<Input, State>) => Effect<void>; // overload 1
export declare const update: <Input, State>(self: Metric<Input, State>, input: Input): Effect<void>; // overload 2
export declare const value: <Input, State>(self: Metric<Input, State>): Effect<State>;
export declare const withAttributes: (attributes: Metric.Attributes): <Input, State>(self: Metric<Input, State>) => Metric<Input, State>; // overload 1
export declare const withAttributes: <Input, State>(self: Metric<Input, State>, attributes: Metric.Attributes): Metric<Input, State>; // overload 2
export declare const withConstantInput: <Input>(input: Input): <State>(self: Metric<Input, State>) => Metric<unknown, State>; // overload 1
export declare const withConstantInput: <Input, State>(self: Metric<Input, State>, input: Input): Metric<unknown, State>; // overload 2
```

## Other Exports (Non-Function)

- `Counter` (interface)
- `CounterState` (interface)
- `CurrentMetricAttributes` (variable)
- `CurrentMetricAttributesKey` (variable)
- `disableRuntimeMetricsLayer` (variable)
- `dump` (variable)
- `enableRuntimeMetricsLayer` (variable)
- `FiberRuntimeMetrics` (variable)
- `FiberRuntimeMetricsImpl` (variable)
- `FiberRuntimeMetricsKey` (variable)
- `FiberRuntimeMetricsService` (interface)
- `Frequency` (interface)
- `FrequencyState` (interface)
- `Gauge` (interface)
- `GaugeState` (interface)
- `Histogram` (interface)
- `HistogramState` (interface)
- `Metric` (interface)
- `MetricRegistry` (variable)
- `snapshot` (variable)
- `Summary` (interface)
- `SummaryState` (interface)
