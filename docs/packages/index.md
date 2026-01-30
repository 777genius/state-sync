---
title: Packages
---

`state-sync` — это monorepo из нескольких npm‑пакетов.

## Packages

- **Core**: [`state-sync`](/packages/core) — engine + protocol + helpers.
- **Pinia**: [`state-sync-pinia`](/packages/pinia) — applier для Pinia store.
- **Tauri**: [`state-sync-tauri`](/packages/tauri) — transport adapters (events+invoke) + DX factory.

Идея расширения: transport adapters и framework adapters — независимые оси.

