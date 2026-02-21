# API Reference: effect/FileSystem

- Import path: `effect/FileSystem`
- Source file: `packages/effect/src/FileSystem.ts`
- Function exports (callable): 11
- Non-function exports: 8

## Purpose

This module provides a comprehensive file system abstraction that supports both synchronous and asynchronous file operations through Effect. It includes utilities for file I/O, directory management, permissions, timestamps, and file watching with proper error handling.

## Key Function Exports

- `FileDescriptor`
- `GiB`
- `isFile`
- `KiB`
- `layerNoop`
- `make`
- `makeNoop`
- `MiB`
- `PiB`
- `Size`
- `TiB`

## All Function Signatures

```ts
export declare const FileDescriptor: (unbranded: number): File.Descriptor;
export declare const GiB: (n: number): Size;
export declare const isFile: (u: unknown): u is File;
export declare const KiB: (n: number): Size;
export declare const layerNoop: (fileSystem: Partial<FileSystem>): Layer.Layer<FileSystem>;
export declare const make: (impl: Omit<FileSystem, typeof TypeId | "exists" | "readFileString" | "stream" | "sink" | "writeFileString">): FileSystem;
export declare const makeNoop: (fileSystem: Partial<FileSystem>): FileSystem;
export declare const MiB: (n: number): Size;
export declare const PiB: (n: number): Size;
export declare const Size: (bytes: SizeInput): Size;
export declare const TiB: (n: number): Size;
```

## Other Exports (Non-Function)

- `File` (interface)
- `FileSystem` (interface)
- `FileTypeId` (variable)
- `OpenFlag` (type)
- `SeekMode` (type)
- `SizeInput` (type)
- `WatchBackend` (class)
- `WatchEvent` (type)
