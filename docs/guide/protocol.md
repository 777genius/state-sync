---
title: Protocol (mental model)
---

`state-sync` uses a simple and reliable pattern:

1. **Invalidation event** сообщает, что “возможно изменилось состояние” и несёт:
   - `topic`
   - `revision`
2. The receiver does a **pull**: `provider.getSnapshot()`
3. The engine applies the snapshot only if it is **newer** (revision gate).

Why:
- events can arrive **out of order**
- events can be **lost**
- the snapshot remains the **source of truth**

### InvalidationEvent

Minimal contract:
- `topic: string`
- `revision: Revision` (canonical decimal `u64` string)

### SnapshotEnvelope

Minimal contract:
- `revision: Revision`
- `data: T`

### What is a protocol error

The engine reports `phase='protocol'` when:
- `topic` is empty / not a string
- `revision` is not canonical (`"01"`, `"abc"`, etc.)

See [Troubleshooting](/troubleshooting) and [Lifecycle](/lifecycle).

