---
title: Protocol (mental model)
---

`state-sync` использует простую и надёжную схему:

1. **Invalidation event** сообщает, что “возможно изменилось состояние” и несёт:
   - `topic`
   - `revision`
2. Получатель делает **pull**: `provider.getSnapshot()`
3. Engine применяет snapshot только если он **новее** (revision gate).

Почему так:
- события могут приходить **в разном порядке**
- события могут **теряться**
- снапшот остаётся **source of truth**

### InvalidationEvent

Минимальный контракт:
- `topic: string`
- `revision: Revision` (каноничная decimal u64 string)

### SnapshotEnvelope

Минимальный контракт:
- `revision: Revision`
- `data: T`

### Что считается ошибкой протокола

Engine репортит `phase='protocol'`, если:
- `topic` пустой/не строка
- `revision` не каноническая (`"01"`, `"abc"`, и т.п.)

См. [Troubleshooting](/troubleshooting) и [Lifecycle](/lifecycle).

