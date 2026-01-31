---
title: Source of truth (in-memory)
---

This example demonstrates a platform-agnostic pattern:
- the invalidation event carries only `topic + revision`
- the consumer pulls a snapshot
- the engine applies a snapshot only if it is newer (revision gate)

See the source: `docs/examples/source-of-truth.ts`.

