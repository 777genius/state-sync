---
title: Packages
---

`state-sync` is a monorepo with multiple npm packages.

## Core

- [`@statesync/core`](/packages/core) — engine, protocol types, retry, throttling, logging.
- [`@statesync/persistence`](/packages/persistence) — storage backends, caching, migration, compression, cross-tab sync.

## Framework adapters

Each adapter applies snapshots to a specific state container. All adapters support `patch`/`replace` modes, `pickKeys`/`omitKeys` filtering, `toState` mapping, and `strict` validation.

- [`@statesync/pinia`](/packages/pinia) — applier for Pinia stores (`$patch`).
- [`@statesync/redux`](/packages/redux) — applier for Redux stores via HOF reducer wrapping.
- [`@statesync/zustand`](/packages/zustand) — applier for Zustand stores (`setState`).
- [`@statesync/valtio`](/packages/valtio) — applier for Valtio proxies (in-place mutation).
- [`@statesync/svelte`](/packages/svelte) — applier for Svelte writable stores (new reference on each apply).
- [`@statesync/vue`](/packages/vue) — applier for Vue `reactive()`/`ref()` values.

## Transport adapters

- [`@statesync/tauri`](/packages/tauri) — transport adapters (events+invoke) + DX factory for Tauri v2 apps.

Transport adapters and framework adapters are **independent axes**: pick one from each category and compose them via the core engine.
