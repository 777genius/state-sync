---
title: Benchmarks
description: Real-world performance benchmarks for state-sync — IPC roundtrip latency, coalescing efficiency, and throughput on Tauri
---

# Benchmarks

The IPC benchmarks below use real Tauri IPC (serde + bridge + JS engine). The [mock benchmarks](#mock-benchmarks-unit-tests) section covers unit-test-level measurements without real IPC. Results may vary based on machine, OS, and concurrent load.

## Real IPC Roundtrip Latency

Full cycle: `invoke(update)` → `event delivery` → `invoke(getSnapshot)` → `apply`.

| Metric | Value |
|--------|-------|
| p50 | 2 ms |
| p95 | 3 ms |
| p99 | 5 ms |
| min | 1 ms |
| max | 8 ms |
| mean | 2.34 ms |

::: info
These numbers include the complete round-trip through the Rust backend and back to JavaScript. Real-world latency is dominated by the Tauri IPC bridge (~0.5 ms per invoke).
:::

---

## Coalescing Efficiency

How many actual IPC fetches happen when N events fire in rapid succession:

| Events fired | Actual fetches | Reduction ratio | E2E time | Rust emit time |
|:------------:|:--------------:|:---------------:|:--------:|:--------------:|
| 10 | 2 | 80% | 4 ms | 0.3 ms |
| 50 | 2 | 96% | 5 ms | 1.2 ms |
| 100 | 2 | 98% | 6 ms | 2.5 ms |
| 500 | 6 | 98.8% | 22 ms | 12 ms |
| 1000 | 16 | 98.4% | 59 ms | 25 ms |

3 runs per event count, median reported.

::: tip
Up to ~100 events, coalescing reduces IPC calls to exactly **2** — one immediate fetch and one trailing fetch for the latest state. At higher volumes, a few extra fetches occur as new invalidation events arrive during the trailing fetch.
:::

---

## End-to-End Throughput

| Metric | Value |
|--------|-------|
| 1000 events → JS applied | 59 ms |
| Throughput | ~17,000 events/sec |
| Rust emit overhead | ~25 ms (42%) |
| JS overhead (coalesce + apply) | ~34 ms (58%) |

---

## Coalescing in Practice

Real-world example: a slider firing at 60fps (16.6 ms between events).

| Without coalescing | With coalescing | Reduction |
|---|---|---|
| 60 IPC fetches/sec | ~2 IPC fetches/sec | **97%** |
| 60 state applies/sec | ~2 state applies/sec | **97%** |

Even with debounce/throttle on top of coalescing, the first update is always **immediate** — no perceived latency for the user.

---

## Mock Benchmarks (unit tests)

These run without real IPC, testing the engine logic in isolation:

| Benchmark | Result |
|-----------|--------|
| `compareRevisions` throughput | > 1M ops/sec (all input categories) |
| Engine coalescing: 100 events | Exactly 2 fetches across all delay configurations |
| Race condition test | Strictly monotonic revisions verified |

---

## How to Run

### Unit test benchmarks

```bash
# Core engine benchmarks
pnpm --filter @statesync/core test -- benchmark

# Tauri transport benchmarks
pnpm --filter @statesync/tauri test -- benchmark
```

### Real Tauri E2E

```bash
cd apps/demo && pnpm tauri:dev
# Benchmark window opens automatically in dev mode
```

---

## Disclaimer

- Numbers depend on machine, OS, and concurrent load
- Real Tauri IPC adds ~0.5 ms per `invoke` call
- Rust `emit` time scales linearly with event count and number of listeners
- Coalescing efficiency is deterministic for low event counts (≤100) and slightly variable for higher counts
- All benchmarks run on a single machine — network latency is not a factor
- Production workloads with heavier serialization payloads will see higher latency than these synthetic benchmarks

## See also

- [Comparison](/comparison) — how state-sync compares to alternatives
- [Throttling & coalescing example](/examples/throttling) — code examples
- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
