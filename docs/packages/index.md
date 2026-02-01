---
title: Packages
---

`state-sync` is a monorepo with multiple npm packages.

## Packages

- **Core**: [`@statesync/core`](/packages/core) — engine + protocol + helpers.
- **Pinia**: [`@statesync/pinia`](/packages/pinia) — an applier for Pinia stores.
- **Tauri**: [`@statesync/tauri`](/packages/tauri) — transport adapters (events+invoke) + DX factory.

Extensibility idea: transport adapters and framework adapters are independent axes.

