# Iteration 0002 — `state-sync`: Production Readiness (packaging, CI, release)

**Status**: Draft  
**Date**: 2026-01-29  
**Iteration goal**: bring `state-sync` to a state where it is safe to hand to external consumers: predictable packaging, CI gates, and reproducible releases.

---

### TL;DR

Iteration `0001` locked the protocol and delivered working packages:

- `@statesync/core` (core engine)
- `@statesync/pinia` (Pinia applier adapter)
- `@statesync/tauri` (Tauri transport adapters)

Iteration `0002` focuses on production readiness:

- publish-grade build artifacts (`dist/`, typings, `exports`)
- release process (semver policy, changelog/versioning)
- CI gates from a clean checkout
- fixing critical safety issues before broad adoption

---

### Problem statement

The library “works locally”, but does not yet meet external-consumer expectations:

- packages are not guaranteed to be publish-grade (stable entrypoints, typings, exports)
- compatibility expectations (Node/tooling/Tauri) are not explicitly documented/enforced
- CI may not represent a clean install environment
- edge-cases in lifecycle and runtime payloads can lead to leaks or crashes

Goal: close these gaps so the library can be installed, tested, and released predictably.

---

### Goals

#### Product goals
- Packages can be installed/imported without “workspace magic”.
- Dual-module support works for typical consumers (Node ESM/CJS, Vite).
- Releases are reproducible in CI from any commit.

#### Engineering goals
- CI runs full quality gates: lint/typecheck/test/build (from a clean checkout).
- Clear semver policy for pre-1.0 and post-1.0.
- Contract tests cover core + transport safety baseline.

---

### Non-goals

- Integration into any specific product (done in the consumer repo).
- CRDT/OT conflict resolution beyond revision-gate (LWW at source of truth).
- Migrating apps to a different state framework.

---

### Current state

Workspace packages:
- `packages/core` → `@statesync/core`
- `packages/pinia` → `@statesync/pinia`
- `packages/tauri` → `@statesync/tauri`

Local tests pass under the workspace.

---

### Priorities

- **P0 (must-fix)**: blocks safe adoption/publishing.
- **P1 (should-fix)**: materially improves quality/DX.
- **P2 (nice-to-have)**: improvements after P0/P1 are closed.

---

### P0 — Critical issues (must-fix)

#### P0.1) Lifecycle safety: `start()` MUST reject after `stop()`

Reason: allowing `stop()` then `start()` can create subscription leaks.  
Acceptance criteria:
- `start()` rejects if called after `stop()`.
- test: “stop-before-start then start → rejects and does not subscribe”.

#### P0.2) Runtime type safety: never crash on garbage IPC payloads

IPC payloads are runtime-unsafe; TS types are not guarantees.  
Acceptance criteria:
- engine operates only on normalized, validated values
- garbage event payloads do not crash; they are reported as `phase='protocol'` and ignored
- tests:
  - invalidation with `revision: 5 as any` does not crash
  - invalidation with `topic: 123 as any` does not crash

#### P0.3) Packaging: publish-grade artifacts and entrypoints

Acceptance criteria for each publishable package:
- `dist/` exists (ESM + CJS if provided)
- `*.d.ts` and (optionally) `*.d.cts` are generated
- `package.json` defines correct `exports`, `types`, and entrypoints

#### P0.4) CI-from-clean-checkout + lockfile discipline

Acceptance criteria:
- CI uses `pnpm install --frozen-lockfile`
- CI runs: `pnpm lint && pnpm -r typecheck && pnpm -r test && pnpm -r build`
- no hidden path dependencies / nested lockfiles

#### P0.5) Public API lifecycle contract is documented and tested

Acceptance criteria:
- docs specify behavior of `RevisionSyncHandle`:
  - `start()` idempotent, `stop()` idempotent
  - `refresh()` before `start()` is explicitly defined
  - `refresh()` after `stop()` does not apply results
  - exceptions thrown by `onError` do not break the engine (caught + logged)
- tests match the documented contract

#### P0.6) Transport safety baseline: no unjustified `any` casts

Acceptance criteria:
- replace `as any` with `unknown` where possible in transport/adapters
- add transport tests for “garbage payload” and ensure engine integration reports protocol error (no crash)

---

### Packaging & build design

#### Decision: build tool

Recommended:
- `tsup` for bundling (ESM + CJS + sourcemaps + d.ts)
- `exports` map as the single source of truth for entrypoints

#### Required outputs per package

- `dist/index.js` (ESM)
- `dist/index.cjs` (CJS) (recommended for compatibility)
- `dist/index.d.ts` and `dist/index.d.cts` (if dual declarations used)
- sourcemaps

#### `package.json` contract (example)

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

---

### Versioning & release process

#### Decision: monorepo versioning

Use `changesets`.

Semver policy:
- pre-`1.0.0`: minor MAY be breaking (document it clearly)
- post-`1.0.0`: strict semver

#### Changelog

Each package publishes its own `CHANGELOG.md`.

#### Release checklist

Maintain a `docs/release-checklist.md` that covers:
- local gates
- changeset workflow
- secrets required for CI release
- smoke-import checks (ESM + CJS)
- docs deployment (GitHub Pages)

---

### CI design

CI must include:
- node matrix (18/20/22)
- lint + typecheck + build + test
- “smoke import” checks for each package (ESM + CJS)

Rust CI (if crate is present):
- `cargo fmt --check`
- `cargo clippy --all-targets -- -D warnings`
- `cargo test`

---

### Acceptance checklist (definition of done)

- [ ] Packages build cleanly and produce publish-grade artifacts.
- [ ] CI passes from a clean checkout with `--frozen-lockfile`.
- [ ] Lifecycle contract is documented and backed by tests.
- [ ] No runtime crashes on garbage payloads; protocol errors are reported.
- [ ] Release process is documented and reproducible.

