# Iteration 0003 — `state-sync`: DX + Observability + Contract Hardening (Google-style design doc)

**Status**: Draft  
**Date**: 2026-01-30  
**Iteration goal**: make the library “pleasant and safe” for external users without adding new protocol semantics:

- improve observability (error phases + structured context)
- strengthen contracts (transport + engine integration tests)
- harden the core loop (non-recursive refresh queue)
- clarify DX policy (peer deps, optional deps, examples)

---

### TL;DR

Iterations `0001–0002` establish the protocol, publishable packages, CI, tests, and basic docs.  
Iteration `0003` is about *external-consumer quality*: better debuggability, fewer sharp edges, and stronger composition-level contracts.

Key idea: **do not invent new protocol features**. Make the current protocol easy to debug, hard to misuse, and predictable to integrate.

---

### Owners / reviewers

- **Owner**: `state-sync` maintainer
- **Reviewers (recommended)**:
  - one engineer who did not write the engine (fresh eyes on contracts)
  - one future integrator (to validate DX and docs)
- **Decision rule**: any behavioral changes (phases/lifecycle) must be captured as “locked decisions” here.

---

### Current state (baseline)

Packages:
- `state-sync` (core): engine + revision utilities + types + retry wrapper(s)
- `state-sync-pinia`: framework adapter (applier) for Pinia-like stores
- `state-sync-tauri`: transport adapters over Tauri events + invoke

Quality:
- unit/contract tests exist for core and adapters
- tsup builds (ESM + CJS + d.ts), `exports` mapping, CI, changesets
- docs exist: lifecycle, compatibility, troubleshooting, guides, examples

Out of scope (by design):
- consumer-specific “source of truth” implementation (app-side commands/services)

---

### Problem statement

Even with publish-ready artifacts, external teams tend to hit the same issues:

1) **Weak observability**: “did it fail in provider or applier?”  
   Without crisp phases and consistent context, debugging takes too long.

2) **Weak composition-level contracts**:  
   unit tests validate parts, but transport ↔ engine integration can drift unnoticed.

3) **Core refresh-loop complexity**:  
   recursive refresh chaining is easy to get wrong and harder to reason about under burst invalidations.

4) **DX ambiguity**:  
   peer dependency policy, optional deps, and example wiring must be unambiguous.

---

### Goals

#### Product goals (for external users)
- Errors and logs make it clear **where** and **why** something failed.
- There is a single “happy path” example that demonstrates correct usage with no product ties.
- Library integration is unsurprising in typical environments (Node, Vite, Tauri).

#### Engineering goals
- `SyncPhase` is accurate and stable.
- There are integration contract tests for transport → engine.
- Core loop is non-recursive and safe under burst load.
- DX policy is documented and aligned with `package.json` metadata.

---

### Success metrics

#### Debuggability
- In most failures, `SyncErrorContext.phase` alone identifies the fix location:
  - `subscribe` vs `getSnapshot` vs `apply` vs `protocol`

#### Contracts
- At least two transport+engine integration tests catch payload-shape drift:
  - garbage payload
  - non-canonical revision

#### DX
- Documentation provides one clear “happy path” and one “pitfalls” section.
- Peer dependency policy for `@tauri-apps/api` is clear.

---

### Non-goals

- No CRDT/OT conflict resolution beyond revision-gate.
- No new transports/adapters purely for feature count.
- No integration into any specific application repository.
- No changes to `0001` locked protocol decisions (topic/revision/invalidation-only).

---

### Priorities

- **P0 (must)**: correctness/contract hardening that prevents bad production incidents.
- **P1 (should)**: substantial DX/observability improvements.
- **P2 (nice)**: polish after P0/P1.

---

### Locked decisions (for 0003)

1) **Phases must be precise**:
   - provider errors → `getSnapshot`
   - applier errors → `apply`
   - `refresh` is an “umbrella fallback” only when classification cannot be more specific
2) **Refresh queue is non-recursive**:
   - loop-based implementation
   - preserves existing coalescing and stop-quiescence semantics
3) **Transport stays thin**:
   - does not “fix” payloads
   - engine validates runtime payloads and reports `protocol` errors
4) **`@tauri-apps/api` peer dependency policy is explicit**:
   - optional peer dependency is acceptable, with clear docs

---

### Design: observability and error phases

#### Problem
Even if types include phases, implementations often blur errors into a generic `refresh` phase.

#### Solution
In core engine:
- `phase='getSnapshot'` for errors thrown by `provider.getSnapshot()`
- `phase='apply'` for errors thrown by `applier.apply()`
- `phase='protocol'` for invalid topic/revision/payload shape
- `phase='subscribe'` for errors thrown by `subscriber.subscribe()`
- `phase='refresh'` only for unexpected errors outside the above buckets

#### Structured logs contract (recommended)
The logger’s `extra` should use stable keys so integrators can build metrics:

- `topic`
- `phase`
- `localRevision?`
- `eventRevision?`
- `snapshotRevision?`
- `sourceId?`
- `error` (only in error logs)

**Note**: “recommended contract” (best-effort), not a hard API guarantee. But core should be consistent.

#### Acceptance criteria
- provider throws → `onError.phase === 'getSnapshot'`
- applier throws → `onError.phase === 'apply'`
- `onError` throwing never breaks the engine (caught + logged)

---

### Design: core loop hardening (non-recursive refresh queue)

#### Problem
Recursive “queued refresh → await refresh()” can be correct but is harder to reason about.

#### Solution
Use an explicit loop:
- at most one queued refresh
- sequential refresh inside a `do...while` or `while` loop
- preserve:
  - coalescing behavior
  - stop quiescence (no apply after stop)
  - start failure cleanup (unsubscribe on start failure)

Reference pseudocode:

```text
refresh():
  if stopped -> return
  if inFlight -> queued=true; return
  inFlight=true
  try:
    loop:
      queued=false
      envelope = provider.getSnapshot()   // phase=getSnapshot
      validate envelope.revision          // phase=protocol
      if stopped -> break
      if shouldApply(envelope):
        applier.apply(envelope)           // phase=apply
        update localRevision
      if stopped -> break
      if !queued -> break
  finally:
    inFlight=false
```

#### Acceptance criteria
- Existing coalescing tests remain green (e.g., burst invalidations don’t produce unbounded snapshot calls).
- stop quiescence remains green (stop during in-flight refresh → no apply).

---

### Design: transport + engine integrated contracts

#### Problem
Transport tests and engine tests can each pass while the composition breaks (payload drift).

#### Solution
Add integration contract tests that wire transport adapters into the engine and validate:
- garbage payload forwarded by transport does not crash engine; engine reports `protocol` error
- non-canonical snapshot revision is detected and reported as `protocol`

#### Acceptance criteria
- At least 2 integration tests cover transport→engine behavior.

---

### DX improvements (non-redundant)

Principle: DX helpers should reduce boilerplate without hiding protocol semantics.

Candidates:
- `createConsoleLogger()` and `tagLogger()` (structured logging, easy tagging)
- `withRetryReporting()` wrapper (visibility into intermediate retries; engine still reports final failure)
- `createTauriRevisionSync()` (wires transport + engine; no new semantics)

Acceptance criteria:
- DX helpers have tests (unit-level).
- Docs recommend one “happy path” integration.

---

### Work breakdown

#### P0
- Lock accurate phase emission with tests (provider/applier/protocol/subscribe).
- Add transport+engine integration tests (garbage payload + non-canonical revision).
- Ensure `stop()` quiescence is covered for in-flight refresh scenarios.

#### P1
- Document structured logging recommendations and a metrics recipe example.
- Clarify peer dependency policy and common pitfalls in READMEs.

#### P2
- Additional adapters/transports (only if demanded by real integrations).

---

### Risks & mitigations

- **Risk**: adding too much DX sugar creates multiple “right ways”.  
  **Mitigation**: keep DX helpers minimal and clearly document “preferred” paths.

- **Risk**: changing phases breaks dashboards/alerts.  
  **Mitigation**: treat `SyncPhase` as part of the public contract; changes are semver-visible.

