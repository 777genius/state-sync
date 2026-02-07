---
title: Examples
---

# Examples

Practical examples demonstrating state-sync patterns.

## Framework examples

| Example | Stack | Description |
|---------|-------|-------------|
| [React + Zustand](/examples/react-zustand) | React, Zustand, BroadcastChannel | Shopping cart synced across browser tabs |
| [Vue + Pinia + Tauri](/examples/vue-pinia-tauri) | Vue 3, Pinia, Tauri v2 | Settings panel synced across Tauri windows |

## Core patterns

| Example | Description |
|---------|-------------|
| [Source of truth](/examples/source-of-truth) | In-memory transport, revision gate, invalidation cycle |
| [Throttling & coalescing](/examples/throttling) | debounceMs, throttleMs, leading/trailing, visual timeline |
| [toState mapping & key filtering](/examples/tostate-mapping) | Backend → frontend transform, pickKeys/omitKeys, ctx |
| [Persistence stack](/examples/persistence-stack) | Compression, TTL, cross-tab sync, cached load |
| [Structured logging](/examples/structured-logging) | JSON logger, error metrics, observability |
| [Error handling & retry](/examples/error-handling) | Graceful degradation, automatic retry, UI indicators |
| [Persistence with migrations](/examples/persistence-migration) | Schema versioning, data migration, validation |

## See also

- [Quickstart](/guide/quickstart) — minimal setup with code snippets for each adapter
- [Writing state](/guide/writing-state) — patterns for the write path (UI → backend)
- [Custom transports](/guide/custom-transports) — build your own subscriber/provider
