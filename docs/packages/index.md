---
title: Packages
---

`state-sync` is a monorepo with multiple npm packages.

## Core

- [`@statesync/core`](/packages/core) — engine + protocol + helpers.

## Framework adapters

- [`@statesync/pinia`](/packages/pinia) — applier for Pinia stores.
- [`@statesync/zustand`](/packages/zustand) — applier for Zustand stores.
- [`@statesync/valtio`](/packages/valtio) — applier for Valtio proxies.
- [`@statesync/svelte`](/packages/svelte) — applier for Svelte writable stores.
- [`@statesync/vue`](/packages/vue) — applier for Vue reactive/ref values.

## Transport adapters

- [`@statesync/tauri`](/packages/tauri) — transport adapters (events+invoke) + DX factory.

Transport adapters and framework adapters are **independent axes**: pick one from each category and compose them via the core engine.

