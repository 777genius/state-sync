# Iteration 0001 — `state-sync`: Bootstrap + Core Protocol (Google-style design doc)

**Status**: Draft  
**Date**: 2026-01-29  
**Iteration goal**: lock protocol boundaries/contracts and define an implementation plan that enables fast delivery without architectural backtracking.

---

### TL;DR

`state-sync` is a small but reliable primitive for synchronizing state between windows/processes:

- **event = invalidation**
- **snapshot = source of truth**
- **revision = monotonic version**

Iteration `0001` locks the design (invariants, public API, layering, contract tests, quality gates) and establishes the “rails” for future work.

---

### Locked decisions (v0)

#### 1) Revision = **canonical decimal `u64` string**

- **Why**: maximizes interoperability (Rust/TS/IPC/JSON) and avoids \(2^{53}-1\) precision loss.
- **Format**: `Revision` MUST be an ASCII base-10 unsigned string representing a `u64`:
  - regex: `^[0-9]+$`
  - canonicalization: `"0"` is allowed; otherwise **no leading zeros** (e.g. `"001"` is invalid)
  - must fit into `u64` (max 20 digits; if 20 digits, must be `<= 18446744073709551615`)
- **Comparison** (no BigInt required in user code):
  - for canonical strings, compare by `(length, lexicographic)`:

```ts
// compare(a,b): -1 | 0 | 1
if (a.length !== b.length) return a.length < b.length ? -1 : 1;
return a === b ? 0 : a < b ? -1 : 1;
```

**Normative**: the library MUST validate revisions at runtime; non-canonical values are **protocol errors**.

#### 2) Invalidation event envelope: required `topic + revision`, everything else optional

- **Required**:
  - `topic`: stable domain/resource identifier (e.g. `"app-config"`, `"auth-state"`)
  - `revision`: canonical decimal `u64` string
- **Optional** (observability only; not required for correctness):
  - `sourceId?: string` — originator (window/process/instance)
  - `timestampMs?: number` — epoch ms; **not used for ordering** (ordering is by revision)
- **Validation (v0 engine)**:
  - `topic` MUST be a non-empty string after `trim()`
  - `revision` MUST be canonical
  - on violation: `onError({ phase: 'protocol', ... })` and the event is **ignored**
- Unknown fields are ignored (forward compatibility).
- **Topic naming recommendation**:
  - kebab-case
  - domain-oriented (not UI/route-oriented)
  - changes rarely (it’s part of the protocol contract)

Example payload:

```json
{
  "topic": "app-config",
  "revision": "42",
  "sourceId": "window:settings:550e8400-e29b-41d4-a716-446655440000",
  "timestampMs": 1738123456789
}
```

#### 3) Errors: `logger` + `onError(context)` as the observability surface

- **`logger`**:
  - default is `noop` (no noise unless consumers opt in)
  - used for engine trace logs (subscribe/refresh/apply/ignore)
- **`onError`**:
  - optional hook for Sentry/metrics/alerts
  - receives context (not just an error)
  - should be fail-safe: errors must not permanently disable the engine, except critical `start()/subscribe` failures

Sketch:

```ts
type SyncPhase = 'subscribe' | 'getSnapshot' | 'protocol' | 'apply' | 'refresh';

type SyncErrorContext = {
  phase: SyncPhase;
  topic?: string;
  error: unknown;
  sourceEvent?: unknown; // raw event payload when applicable
  attempt?: number; // if retry wrapper reports attempts
  willRetry?: boolean;
  nextDelayMs?: number;
};
```

Normative behavior:
- errors during invalidation/refresh processing MUST:
  - call `onError` (if provided)
  - be logged (if logger enabled)
  - NOT permanently disable the engine
- subscription failures are critical: `start()` MUST reject.

#### 4) Retry/backoff is NOT in the core engine

- **Why**: retry is a policy that depends on the data source and domain needs.
- **v0 decision**:
  - core engine makes a single `provider.getSnapshot()` attempt.
  - retry is implemented as a wrapper around `SnapshotProvider`: `withRetry(provider, policy)`.
  - default is **no retry**.

Guideline policy (non-normative): exponential backoff + jitter with `maxAttempts=3`.

---

### Problem statement

In multi-window apps (Tauri/Electron/browser tabs), the same logical state is read/written from multiple UI contexts. In practice:

- events can be **lost**
- windows may subscribe **late**
- ordering can be unreliable
- “sharing stores” directly is not feasible

Typical symptoms without a standard:
- a window gets stuck on stale data (missed event)
- startup/open race (subscribed after update happened)
- sync logic is duplicated across feature/store layers (DRY violation)
- reliability is hard to test (no stable contract scenarios)

---

### Goals

#### Functional
- **Late-join safety**: a new window can always catch up even if it missed events.
- **Inversion of responsibility**: windows do not “push state”; they react to invalidation and pull snapshots.
- **Universality**:
  - framework-agnostic (Pinia/React/vanilla state/cache)
  - transport-agnostic (Tauri events+invoke; later BroadcastChannel, etc.)
- **Minimal and understandable API**: any engineer can wire it up without internal knowledge.

#### Non-functional / quality
- Clean Architecture: core depends on no transport/framework.
- SOLID / DIP: core depends only on abstractions; infrastructure is plugged in.
- Contract tests: same scenarios must run against any transport.
- Lint/format/typecheck are enforced from day 1.

---

### Non-goals

To avoid becoming a “state framework”:
- no reducers/actions/stores framework
- no CRDT/OT multi-writer conflict resolution (v0 uses LWW at the source of truth)
- no mandatory persistence/encryption/storage (source-of-truth responsibility)
- no network sync (only local windows/processes/contexts)
- no direct coupling to Pinia/Zustand (adapters are separate packages/layers)
- no integration plan for specific products (always authored in the consumer repo)

---

### Protocol invariants (normative)

1) **Monotonic revision**  
   Source of truth increments `revision` on each logical change.

2) **Event = invalidation**  
   Events do not carry state; they signal “state may have changed”.

3) **Snapshot = only data source**  
   State is applied only from snapshots (pull), not from events.

4) **Apply only if newer**  
   A window stores `localRevision`. Apply snapshot only if `snapshot.revision > localRevision`.

5) **Startup ordering: subscribe → refresh**  
   Subscribe first, then refresh, to avoid “refresh then missed event” races.

6) **Fail-safe refresh**  
   Snapshot failures do not permanently disable the engine; errors are surfaced via logger/onError.

---

### Architecture (Clean Architecture)

#### Domain
Pure types and invariants:
- `Revision`
- `Topic`
- `InvalidationEvent` (`topic`, `revision`, optional `sourceId`/`timestampMs`)
- `SnapshotEnvelope<T>` (`revision`, `data`)

#### Application
Synchronization engine:
- lifecycle (`start/stop/refresh`)
- subscribe → refresh
- revision gate + coalescing
- protocol validation + error reporting

#### Infrastructure (transport adapters)
How invalidations and snapshots are delivered:
- Tauri transport: `listen` (events) + `invoke` (snapshots)
- other transports later (BroadcastChannel, in-memory, etc.)

#### Framework adapters
How to apply snapshots into a specific state container:
- Pinia applier adapter (separate package)
- others later (Zustand, Redux, custom caches, etc.)

---

### Public API (v0)

Core interfaces:

```ts
export interface InvalidationSubscriber {
  subscribe(handler: (e: unknown) => void): Promise<() => void>;
}

export interface SnapshotProvider<T> {
  getSnapshot(): Promise<{ revision: string; data: T }>;
}

export interface SnapshotApplier<T> {
  apply(envelope: { revision: string; data: T }): void | Promise<void>;
}

export interface RevisionSyncHandle {
  start(): Promise<void>;
  stop(): void;
  refresh(): Promise<void>;
  getLocalRevision(): string;
}
```

Engine factory:

```ts
export function createRevisionSync<T>(options: {
  topic: string;
  subscriber: InvalidationSubscriber;
  provider: SnapshotProvider<T>;
  applier: SnapshotApplier<T>;
  shouldRefresh?: (event: unknown) => boolean;
  logger?: Logger;
  onError?: (ctx: SyncErrorContext) => void;
}): RevisionSyncHandle;
```

Lifecycle contract is documented in `docs/lifecycle.md` (v0 must be consistent with tests).

---

### Testing strategy (contract-first)

Core contracts (must-have):
- late-join safe: `start()` always fetches initial snapshot
- revision gate: ignore snapshots with `<= localRevision`
- out-of-order events: ignore stale invalidations
- coalescing: burst invalidations result in bounded refreshes
- stop quiescence: no apply after stop
- start failure cleanup: if `start()` fails, unsubscribe and reset state
- protocol validation: garbage topic/revision never crashes; is reported as `phase='protocol'`

Transport contracts:
- transport forwards payloads; engine validates
- integration tests cover composition: transport → engine

---

### Work breakdown

#### P0 (must for 0001)
- Implement revision validation + comparison helpers.
- Implement core engine with:
  - subscribe → initial refresh
  - refresh queue coalescing
  - revision gate
  - stop quiescence
  - runtime protocol validation and `phase='protocol'` reporting
- Establish quality gates:
  - biome lint/format
  - strict TS typecheck
  - vitest contract tests

#### P1
- Add basic DX helpers (logger helpers, retry wrapper) if needed for adoption.
- Add documentation skeleton (quickstart, protocol, lifecycle).

---

### Risks & mitigations

- **Risk**: consumers misuse `start/stop` lifecycle.  
  **Mitigation**: strict contract + tests + docs.

- **Risk**: transports supply garbage payloads.  
  **Mitigation**: runtime validation; never trust TS types at runtime.

- **Risk**: coalescing semantics become unclear.  
  **Mitigation**: contract tests that lock behavior.

