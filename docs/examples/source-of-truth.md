---
title: Source of truth (in-memory)
---

Этот пример показывает platform‑agnostic схему:
- invalidation event несёт только `topic + revision`
- consumer делает pull snapshot
- engine применяет snapshot только если он новее (revision gate)

См. исходник: `docs/examples/source-of-truth.ts`.

