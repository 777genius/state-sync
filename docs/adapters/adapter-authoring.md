## Adapter authoring guide (framework adapters)

This document describes a **recommended format** for writing framework adapters in `state-sync`.

The goal is to keep the core protocol **framework-agnostic**, while enabling high-quality adapters
that reduce boilerplate and integration mistakes.

### What an adapter is (and isn’t)

- An adapter **is** a small module that knows how to apply `SnapshotEnvelope<T>` into a specific state container.
- An adapter **is not** a transport, and does not define the protocol (revision/topic/event semantics).
- An adapter **does not** fetch snapshots or listen to invalidation events.

In other words: adapters are about **DX**, not about correctness.
Correctness lives in the protocol and sync engine.

### Minimum surface area (recommended)

For each framework adapter:

1) Define a minimal **structural interface** for the host container.
   - Prefer *structural typing* over importing framework runtime or deep types.
   - Keep it small and stable.

2) Export a single factory function:
   - `create<Framework>SnapshotApplier(...) -> SnapshotApplier<T>`

3) Provide a focused options object:
   - `mode`: `'patch' | 'replace'` (if applicable)
   - `toState(data, ctx)`: mapping function from snapshot data to a patch or full state
   - `strict`: whether to throw on invalid mapping (default: `true`)

4) Add tests using a **stub host** (no need to run the real framework in tests):
   - patch vs replace semantics
   - mapping function
   - strict vs non-strict behavior

### Naming and packaging

Recommended package structure:

- Create a separate workspace package under `packages/<framework>/`
- Package name recommendation:
  - `@statesync/<framework>` (example: `@statesync/pinia`)

Recommended exports:

- Keep core exports in `packages/core`
- Adapters are **separate packages** and should not be re-exported by the core package.
  This keeps dependency graphs clean and avoids pulling adapter code into consumers that don’t use it.

### Quality bar (non-negotiable)

- No global mutable state.
- Idempotent behavior where possible.
- Clear runtime errors (actionable messages).
- 100% typed public surface, no `any` leaks in the exported API.

