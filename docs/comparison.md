---
title: Comparison
description: Comparison of state-sync vs alternatives for multi-window state synchronization
---

# state-sync vs Alternatives

Comparison for multi-window state synchronization.

## The Problem

When you have multiple windows/tabs sharing state, updates can arrive out of order:

```
Window A: set(1) ──────────────────► arrives second
Window B: set(2) ──► arrives first
Result: state = 1 (wrong, should be 2)
```

Most libraries ignore this. state-sync solves it with revision-based ordering.

---

## Quick Comparison

| Library | Ordering | Throttling | Retry | Persistence | Framework |
|---------|:--------:|:----------:|:-----:|:-----------:|-----------|
| **state-sync** | ✅ Revision-based | ✅ Full | ✅ | ✅ Separate pkg | Any |
| zubridge | ❌ | ❌ | ❌ | ❌ | Any |
| pinia-shared-state | ❌ | ❌ | ❌ | ❌ | Pinia only |
| zustand-sync-tabs | ⚠️ "Latest wins" | ❌ | ❌ | ✅ localStorage | Zustand only |
| tauri-plugin-store | ❌ | ✅ Debounce | ❌ | ✅ File | Any |

---

## How state-sync Works

```
Backend: state changed → emit("invalidated")
    ↓
All windows: receive event
    ↓
Each window: fetch snapshot → revision > local? → apply (else skip)
```

Stale updates are automatically rejected. Rapid events are coalesced.

---

## Direct Competitors

### zubridge ⭐44

Redux-like actions over Tauri/Electron IPC.

```ts
dispatch({ type: 'SET_VALUE', payload: 1 })
```

**Good:** Familiar Redux pattern, works with any framework.

**Bad:** No ordering, no coalescing, no retry, no persistence.

**Use when:** Your team knows Redux and ordering doesn't matter.

---

### pinia-shared-state ⭐298

BroadcastChannel sync for Pinia.

```ts
pinia.use(PiniaSharedState({ enable: true }))
```

**Good:** Simple API, ~1KB.

**Bad:** No ordering, no error handling, browser-only (no Tauri IPC).

**Use when:** Simple browser tabs, don't care about edge cases.

---

### zustand-sync-tabs ⭐43

BroadcastChannel + localStorage sync for Zustand.

```ts
create(persistNSync((set) => ({ ... }), { name: 'store' }))
```

**Good:** ~1KB, includes localStorage persistence, "latest state wins" approach.

**Bad:** No revision tracking (still possible to apply stale state), browser-only.

**Use when:** Zustand app, simple sync needs.

---

### tauri-plugin-store

Official Tauri key-value storage.

```ts
const store = await Store.load('settings.json')
await store.set('theme', 'dark')
```

**Good:** Official, file persistence, debounce, multi-window sync.

**Bad:** No ordering, no migration, no compression. For preferences, not complex state.

**Use when:** Simple app settings.

---

## When to Use state-sync

- **Ordering matters** — config, auth, anything where stale writes are wrong
- **Rapid updates** — coalescing prevents IPC spam
- **Need retry** — exponential backoff on failures
- **Want structure** — phase-based errors, not just try/catch
- **Multiple frameworks** — Pinia, Zustand, Valtio, Svelte, Vue adapters

---

## When NOT to Use state-sync

- **Collaborative editing** — use [Yjs](https://github.com/yjs/yjs) or [TinyBase](https://tinybase.org/) (CRDT)
- **Simple preferences** — tauri-plugin-store is enough
- **Redux team** — zubridge may feel more familiar
- **Absolute minimal bundle** — zustand-sync-tabs is smaller

---

## Bundle Size (minified + gzipped)

| Package | Size |
|---------|------|
| @statesync/core | 3.1 KB |
| @statesync/persistence | 6.9 KB |
| @statesync/pinia | 0.8 KB |
| @statesync/zustand | 0.7 KB |
| zustand-sync-tabs | ~1 KB |
| pinia-shared-state | ~1 KB |

Core is larger because it includes ordering, throttling, retry, and structured error handling.

---

## Links

- [zubridge](https://github.com/goosewobbler/zubridge) — Redux-like for Tauri/Electron
- [pinia-shared-state](https://github.com/wobsoriano/pinia-shared-state) — Pinia tab sync
- [zustand-sync-tabs](https://github.com/react18-tools/zustand-sync-tabs) — Zustand tab sync
- [tauri-plugin-store](https://v2.tauri.app/plugin/store/) — Tauri KV storage
- [Yjs](https://github.com/yjs/yjs) — CRDT for collaborative editing
- [TinyBase](https://tinybase.org/) — Reactive store with CRDT

## See also

- [Quickstart](/guide/quickstart) — get started with state-sync
- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
