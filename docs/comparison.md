---
title: Comparison
description: Honest comparison of state-sync vs alternatives for multi-window state synchronization across Tauri, Electron, and browser ecosystems
---

# state-sync vs Alternatives

Honest comparison for multi-window state synchronization. If a simpler tool fits your use case — use it. We'll tell you which one.

## The Problem

When multiple windows share state, updates can arrive out of order:

```
Window A: set(1) ──────────────────► arrives second
Window B: set(2) ──► arrives first
Result: state = 1 (wrong, should be 2)
```

Many simple sync libraries don't address this. state-sync solves it with revision-based ordering.

---

## Coalescing vs Debounce

These are different things. Debounce **delays** the first response. Coalescing delivers the first event **immediately** and batches the rest.

```
Debounce (waits for silence):
  events:  ×  ×  ×  ×  ×  ·  ·  ·  ·  →  fetch
  time:    0  1  2  3  4  5  6  7  8     (ms)
           ↑                              ↑
           first event                    response (delayed 4+ ms)

Coalescing (at most 2 IPC calls):
  events:  ×  ×  ×  ×  ×
  time:    0  1  2  3  4  (ms)
           ↑           ↑
           fetch₁      fetch₂ (latest state)
           immediate   immediate
```

| | Debounce | Throttle | Coalescing |
|---|---|---|---|
| First event | Delayed | Immediate | Immediate |
| During burst | Waits for silence | Fires at interval | At most 2 IPC calls |
| IPC calls for 100 events | 1 (delayed) | ~N/interval | 2 |
| Stale data risk | Low (but delayed) | Medium | Very low (revision-checked) |

::: info
state-sync supports debounce and throttle **on top of** coalescing. You can combine them — coalescing handles the IPC layer, while debounce/throttle controls how often your UI re-renders.
:::

---

## How state-sync Works

```
Backend: state changed → emit("invalidated")
    ↓
All windows: receive event
    ↓
Each window: fetch snapshot → revision > local? → apply (else skip)
```

Stale updates are automatically rejected. Rapid events are coalesced into at most 2 fetches per burst, regardless of event count during that burst.

---

## Feature Matrix

| Feature | state-sync | @tauri-store | tauri-plugin-store | zubridge | zustand-sync-tabs | pinia-shared-state |
|---------|:----------:|:------------:|:-----------------:|:--------:|:-----------------:|:------------------:|
| Revision ordering | ✅ | ❌ | ❌ | ❌ | ⚠️ Latest wins | ❌ |
| Coalescing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Debounce/Throttle | ✅ | ✅ SaveStrategy | ✅ Debounce | ❌ | ❌ | ❌ |
| Retry | ✅ Exponential | ❌ | ❌ | ❌ | ❌ | ❌ |
| Persistence | ✅ Separate pkg | ✅ Built-in | ✅ File | ❌ | ✅ localStorage | ❌ |
| Framework | Any | Zustand / Pinia | Any | Any | Zustand only | Pinia only |
| Tauri IPC | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Electron IPC | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Browser (BroadcastChannel) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Actively maintained | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Last commit Feb 2025 |

::: tip Webview-only libraries in Tauri
zustand-sync-tabs and pinia-shared-state use `BroadcastChannel` to sync between Tauri webviews. This works, but it does **not** go through the Rust–JS IPC bridge — meaning the Rust backend has no visibility into state changes.
:::

---

## Tauri Ecosystem

### @tauri-store/zustand + @tauri-store/pinia

The main alternative for Tauri apps. Clean DX with built-in disk persistence.

```ts
import { create } from 'zustand';
import { createTauriStore } from '@tauri-store/zustand';

const useCounterStore = create((set) => ({
  counter: 0,
  increment: () => set((s) => ({ counter: s.counter + 1 })),
}));

const tauriStore = createTauriStore('counter', useCounterStore);
await tauriStore.start();
```

**Good:** Clean DX, disk persistence built-in, `SaveStrategy` with debounce/throttle, actively maintained, great for simple cases.

**Limitations:** No revision ordering (debounce ≠ coalescing — see [above](#coalescing-vs-debounce)), Zustand or Pinia only, Tauri 2.x only.

**Use @tauri-store when:** Simple Tauri app with Zustand or Pinia, ordering doesn't matter, want persistence with minimal setup.

**Use state-sync instead when:** Ordering matters, you need coalescing for rapid updates, want retry on failure, or need framework flexibility beyond Zustand/Pinia.

---

### tauri-plugin-store

Official Tauri key-value storage. Built for preferences, not complex state.

```ts
const store = await Store.load('settings.json')
await store.set('theme', 'dark')
```

**Good:** Official, file persistence, debounce, multi-window sync.

**Limitations:** No ordering guarantees, no migration system, no compression. Designed for preferences, not complex state synchronization.

**Use when:** Simple app settings — theme, language, window positions.

---

### zubridge (Tauri mode)

Redux-like actions over Tauri IPC. Also works with Electron (see below).

```ts
import { initializeBridge } from '@zubridge/tauri';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

initializeBridge({ invoke, listen });

// In components:
import { useZubridgeStore, useZubridgeDispatch } from '@zubridge/tauri';

const count = useZubridgeStore((state) => state.count);
const dispatch = useZubridgeDispatch();
dispatch({ type: 'increment' });
```

**Good:** Familiar Redux pattern, works with any framework, cross-platform (Tauri + Electron).

**Limitations:** No ordering, no coalescing, no retry, no persistence.

**Use when:** Your team knows Redux and ordering doesn't matter.

---

### Browser-based libraries in Tauri

**zustand-sync-tabs** and **pinia-shared-state** work in Tauri webviews via `BroadcastChannel`. They sync between webviews, but **not** through Rust IPC — the Rust backend never sees these state changes.

```ts
// zustand-sync-tabs
import { syncTabs } from 'zustand-sync-tabs';

create(syncTabs((set) => ({ ... }), { name: 'my-channel' }))

// pinia-shared-state
pinia.use(PiniaSharedState({ enable: true }))
```

**Good:** Tiny (~1 KB each), zero config, simple API.

**Limitations:** No ordering, no error handling, browser-only transport, Rust backend is blind to state.

**Use when:** Lightweight UI sync between Tauri webviews where backend awareness isn't needed.

---

## Electron Ecosystem

### @zubridge/electron

Active successor to `zutron`. Main process acts as source of truth, TypeScript-first.

```ts
// Main process
import { createZustandBridge } from '@zubridge/electron/main';

const bridge = createZustandBridge(store);
const { unsubscribe } = bridge.subscribe([mainWindow]);
```

**Good:** Active development, TypeScript, main process as source of truth, works with any framework.

**Limitations:** No coalescing, no ordering, no retry.

**Use when:** Electron + Redux pattern, don't need ordering guarantees.

---

### electron-redux

StoreEnhancer pattern by Klarna.

**Good:** Well-designed API, Redux ecosystem integration.

**Bad:** Depends on deprecated `electron.remote` — **broken with Electron 14+** (removed in 2021). Not for new projects.

---

### electron-shared-state

Immer-based shared state for Electron.

**Good:** Immer integration, TypeScript.

**Bad:** Inactive 12+ months. No ordering, no retry.

---

### reduxtron

Small Redux bridge for Electron with demo apps.

**Good:** Minimal, Redux-based, active with examples.

**Bad:** No ordering, no coalescing, no retry.

---

::: warning Not recommended for new projects
- **electron-state-ipc** — abandoned 3+ years
- **vuex-electron** — inactive, Vuex 3 only
- **electron-store** — persistence/config tool, **not** state sync (commonly confused)
:::

---

## When to Use state-sync

- **Ordering matters** — config, auth, anything where stale writes corrupt state
- **Rapid updates** — coalescing prevents IPC flood (100 events → 2 fetches)
- **Need retry** — exponential backoff on IPC failures
- **Want structure** — phase-based errors, not just try/catch
- **Multiple frameworks** — Zustand, Pinia, Vue, Valtio, Svelte adapters
- **Cross-platform** — same core for Tauri and Electron
- **Persistence with migrations** — versioned state upgrades via `@statesync/persistence`

---

## When NOT to Use state-sync

| Use case | Better choice |
|----------|--------------|
| Simple Tauri + Zustand/Pinia | [@tauri-store/*](https://github.com/ferreira-tb/tauri-store) — simpler API, built-in persistence |
| App preferences / settings | [tauri-plugin-store](https://v2.tauri.app/plugin/store/) — official, minimal |
| Collaborative editing | [Yjs](https://github.com/yjs/yjs) or [Automerge](https://automerge.org/) — CRDT-based |
| Electron + Redux pattern | [@zubridge/electron](https://github.com/goosewobbler/zubridge) — Redux familiar |
| Minimal bundle, browser tabs only | [zustand-sync-tabs](https://github.com/react18-tools/zustand-sync-tabs) / [pinia-shared-state](https://github.com/wobsoriano/pinia-shared-state) |
| Single window app | You don't need state sync at all |

---

## Bundle Size (minified + gzipped)

### state-sync packages

| Package | Size |
|---------|------|
| @statesync/core | ~3 KB |
| @statesync/tauri | < 1 KB |
| @statesync/electron | < 1 KB |
| @statesync/persistence | ~7 KB |
| @statesync/zustand | < 1 KB |
| @statesync/pinia | < 1 KB |
| @statesync/vue | < 1 KB |
| @statesync/valtio | < 1 KB |
| @statesync/svelte | < 1 KB |

### Alternatives

| Package | Size |
|---------|------|
| @tauri-store/zustand | ~7.7 KB |
| @tauri-store/pinia | ~12 KB |
| zustand-sync-tabs | ~1 KB |
| pinia-shared-state | ~4.2 KB |
| @zubridge/electron | ~8 KB |

Sizes via [bundlejs.com](https://bundlejs.com). @tauri-store packages include shared dependencies (`@tauri-store/shared`, `@tauri-apps/api`); in a real app with both packages, shared code is deduplicated.

@statesync/core is larger than zustand-sync-tabs because it includes ordering, coalescing, throttling, retry, and structured error handling.

---

## Decision Flowchart

```mermaid
flowchart TD
    A[What platform?] --> B{Tauri}
    A --> C{Electron}
    A --> D{Browser only}

    B --> B1{Need ordering / coalescing?}
    B1 -->|Yes| SS1[state-sync]
    B1 -->|No| B2{Simple KV settings?}
    B2 -->|Yes| TPS[tauri-plugin-store]
    B2 -->|No| B3{Zustand or Pinia?}
    B3 -->|Yes| TS[@tauri-store/*]
    B3 -->|No| B4{Redux pattern?}
    B4 -->|Yes| ZB1[zubridge]
    B4 -->|No| SS2[state-sync]

    C --> C1{Need ordering / coalescing?}
    C1 -->|Yes| SS3[state-sync]
    C1 -->|No| C2{Redux pattern?}
    C2 -->|Yes| ZB2[@zubridge/electron]
    C2 -->|No| C3{Need any state sync?}
    C3 -->|Yes| SS4[state-sync]
    C3 -->|No| NS1[No sync needed]

    D --> D1{Zustand?}
    D1 -->|Yes| ZST[zustand-sync-tabs]
    D1 -->|No| D2{Pinia?}
    D2 -->|Yes| PSS[pinia-shared-state]
    D2 -->|No| D3{Need state sync?}
    D3 -->|Yes| CSS[state-sync\nwith custom transport]
    D3 -->|No| NS2[No sync needed]

    style SS1 fill:#10b981,color:#fff
    style SS2 fill:#10b981,color:#fff
    style SS3 fill:#10b981,color:#fff
    style SS4 fill:#10b981,color:#fff
```

---

## Links

### Tauri
- [@tauri-store/zustand](https://github.com/ferreira-tb/tauri-store) — Zustand + Tauri persistence
- [tauri-plugin-store](https://v2.tauri.app/plugin/store/) — Official Tauri KV storage
- [zubridge (Tauri)](https://github.com/goosewobbler/zubridge) — Redux-like for Tauri

### Electron
- [@zubridge/electron](https://github.com/goosewobbler/zubridge) — Redux-like for Electron
- [reduxtron](https://github.com/vitordino/reduxtron) — Small Redux bridge for Electron

### Browser
- [zustand-sync-tabs](https://github.com/react18-tools/zustand-sync-tabs) — Zustand tab sync
- [pinia-shared-state](https://github.com/wobsoriano/pinia-shared-state) — Pinia tab sync

### CRDT (collaborative editing)
- [Yjs](https://github.com/yjs/yjs) — CRDT for collaborative editing
- [Automerge](https://automerge.org/) — CRDT library
- [TinyBase](https://tinybase.org/) — Reactive store with CRDT

## See also

- [Benchmarks](/benchmarks) — real IPC latency and coalescing efficiency numbers
- [Quickstart](/guide/quickstart) — get started with state-sync
- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
