---
title: Packages
---

`state-sync` is a monorepo with multiple npm packages.

## Packages

- **Core**: [`state-sync`](/packages/core) — engine + protocol + helpers.
- **Pinia**: [`state-sync-pinia`](/packages/pinia) — an applier for Pinia stores.
- **Tauri**: [`state-sync-tauri`](/packages/tauri) — transport adapters (events+invoke) + DX factory.

Extensibility idea: transport adapters and framework adapters are independent axes.

