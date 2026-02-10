---
title: "6 Problems in 15 Lines: Why Multi-Window Tauri Apps Need a Sync Engine"
description: The problem with manual multi-window state sync in Tauri, and how state-sync solves it with an invalidation-pull model.
outline: deep
---

# 6 Problems in 15 Lines: Why Multi-Window Tauri Apps Need a Sync Engine

You open a settings panel in a separate Tauri window. Switch the theme to "dark." Close the window. The main window is still in "light." The user is confused. So are you.

I hit this exact problem while building a multi-window Tauri app. After the third attempt at hand-rolling event sync — and the third round of subtle bugs — I decided to build a proper solution.

---

## The Problem With Multi-Window Tauri Apps

In Tauri, every window runs its own isolated JavaScript context. There's no shared memory, no global store, no magic bridge. When window A changes state, window B has no idea.

Most developers discover this the hard way. I certainly did. The single-window prototype works perfectly. Then you add a second window — and chaos begins.

Here's what the "just wire up events" approach typically looks like:

```typescript
// The naive approach — manual multi-window sync
let localRevision = 0;

const unlisten = await listen('settings-changed', async (event) => {
  const payload = event.payload as { revision: number };

  // BUG 1: Number comparison breaks for large u64 values
  if (payload.revision <= localRevision) return;

  // BUG 2: No coalescing — 100 rapid events = 100 IPC calls
  try {
    const snapshot = await invoke('get_settings');

    // BUG 3: Race condition — a slow response can overwrite newer data
    store.$patch(snapshot.data);
    localRevision = snapshot.revision;
  } catch (err) {
    // BUG 4: No retry logic
    // BUG 5: No structured error handling
    console.error('Sync failed:', err);
  }
});
// BUG 6: No lifecycle management — what happens on window close?
```

Six problems in 15 lines. And this is the *simple* version. I know because I've written variations of this code three times — each time thinking "this time I'll get it right." Real apps add retry loops, manual debouncing, revision tracking per topic — easily 200+ lines of ad-hoc sync code per store. Untested, fragile, and different in every project.

The pattern these problems expose is always the same: trying to push state through events, when what you really need is an invalidation signal plus a pull mechanism. I looked for an existing library that did this cleanly for Tauri. I didn't find one. So I built one.

## state-sync — What It Is and How It Works

[state-sync](https://github.com/777genius/state-sync) is a small, framework-agnostic library for Tauri v2 that handles the hard parts of multi-window state synchronization. You provide three things:

1. A **subscriber** — tells the engine "something changed"
2. A **provider** — fetches the canonical snapshot from the backend
3. An **applier** — writes the snapshot into your local state store

The engine handles everything else: ordering, coalescing, lifecycle, error recovery.

### The Invalidation-Pull Model

Here's the key insight that makes state-sync resilient: **events don't carry data.**

Think of it like push notifications on your phone. The notification says "You have new mail." It doesn't contain the email text. You open the mail app and *pull* the current state. If a notification was lost — the next one still catches you up.

The same principle applies here:

```
Window A changes settings
       ↓
Rust backend updates state, increments revision to "42"
       ↓
Backend broadcasts: { topic: "settings", revision: "42" }
       ↓                                    ↓
Window B receives event               Window C receives event
       ↓                                    ↓
"42" > my local "41"? Yes → fetch     "42" > my local "42"? No → skip
       ↓
invoke('get_settings') → { revision: "42", data: {...} }
       ↓
Apply to local store
```

This makes the system naturally tolerant to real-world IPC problems:
- **Lost event?** The next invalidation will have a higher revision — sync catches up.
- **Duplicate event?** Revision gate filters it: `event.revision <= localRevision → skip`.
- **Out-of-order delivery?** Only newer revisions are accepted.
- **Large payload?** It's fetched once on demand, not duplicated in every event.

Here's the same settings sync from above, rewritten with state-sync:

```typescript
import { createTauriRevisionSync } from '@statesync/tauri';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from './stores/settings';
import type { Settings } from './types';

const handle = createTauriRevisionSync<Settings>({
  topic: 'settings',
  listen,
  invoke,
  eventName: 'state-sync:invalidation',
  commandName: 'get_settings',
  applier: createPiniaSnapshotApplier(useSettingsStore(), {
    mode: 'patch',
    omitKeys: ['localUiFlag'],
  }),
  throttling: { debounceMs: 50, throttleMs: 200 },
  onError(ctx) {
    console.error(`[${ctx.phase}] ${ctx.error}`);
  },
});

await handle.start();
// Coalescing, revision ordering, lifecycle — all handled.
```

~15 lines. Zero race conditions. Built-in coalescing, throttling, and structured error reporting.

| Aspect | Manual approach | state-sync |
|--------|----------------|------------|
| Boilerplate | ~200 lines per store | ~15 lines |
| Race conditions | On you | Revision ordering + coalescing |
| Thundering herd | On you | Coalesced — at most one queued fetch behind an in-flight one |
| Late joiner | On you | Automatic initial refresh on `start()` |
| Error handling | `try/catch` | 8 structured phases: `subscribe`, `invalidation`, `refresh`, `getSnapshot`, `apply`, `protocol`, `throttle`, `start` |
| Test coverage | On you | 370+ tests including IPC jitter, event drops, mutex contention |

Let's break down the key claims from that table.

## Under the Hood: Three Key Design Decisions

### Revisions: 21 Lines That Solve Ordering

state-sync doesn't use vector clocks, Lamport timestamps, or CRDTs. Revisions are monotonic `u64` counters encoded as strings — and comparison is just a few lines:

```typescript
export function compareRevisions(a: Revision, b: Revision): -1 | 0 | 1 {
  if (a === b) return 0;
  if (a.length !== b.length) return a.length < b.length ? -1 : 1;
  return a < b ? -1 : 1;
}
```

Why strings? JavaScript's `Number.MAX_SAFE_INTEGER` is `2^53 - 1`. A `u64` goes up to `2^64 - 1`. String encoding avoids precision loss without requiring `BigInt` — and it's JSON/IPC-friendly out of the box.

The length-first comparison trick works because canonical decimal representations have no leading zeros: `"9"` is always shorter than `"10"`, so length comparison gives the correct order. Same-length strings are compared lexicographically, which matches numeric order for same-digit-count numbers.

### Coalescing: 100 Events, 2 Fetches

When a user drags a slider or types rapidly, the backend might broadcast dozens of invalidation events per second. Without protection, each event triggers an IPC round-trip — serialize, cross the Rust-JS bridge, deserialize, serialize the response, cross back, deserialize. At 100 events, that's 100 round-trips.

state-sync's engine uses two booleans — `refreshInFlight` and `refreshQueued` — to solve this:

```
Events arrive at t=0, t=5, t=10, t=15, t=20, t=25ms

Without coalescing:
  t=0   fetch() ──────────────────── apply(rev=1)
  t=5   fetch() ─────────────── apply(rev=2)
  t=10  fetch() ────────── apply(rev=3)        ← 6 IPC round-trips
  t=15  fetch() ─────── apply(rev=4)
  t=20  fetch() ──── apply(rev=5)
  t=25  fetch() ── apply(rev=6)

With state-sync:
  t=0   fetch() ──────────────────── apply(rev=3)
        ↑ events at t=5,10 coalesced (refreshInFlight=true)
  t=25  fetch() ────── apply(rev=6)            ← 2 IPC round-trips
        ↑ one queued refresh picks up the latest
```

While a fetch is in-flight, all incoming events collapse into a single `refreshQueued = true` flag. When the in-flight fetch completes, the engine runs exactly one more cycle — which always gets the *latest* snapshot. The result: at most one queued fetch behind the in-flight one, regardless of how many events arrive.

On top of this, you can optionally configure `throttling` with `debounceMs` and `throttleMs` for additional rate control — useful when you want to wait for a "quiet period" before refreshing.

There's also `shouldRefresh` — a predicate that lets you filter invalidation events before they enter the coalescing pipeline. A common use case is self-echo filtering: when window A triggers a state change, Rust broadcasts to *all* windows — including A. Since A already has the latest state, it can skip the redundant fetch:

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

// Filter out self-triggered invalidations
shouldRefresh: (event) => event.sourceId !== getCurrentWindow().label,
```

### No Write Path — By Design

state-sync only handles the *read* direction: backend → all windows. There's no `store.set()`, no `sync.push()`, no write API.

This is intentional. The Rust backend is the single source of truth. Windows write state by calling Tauri commands (`invoke`), which update the backend and trigger invalidation. state-sync then distributes the result.

This eliminates an entire class of problems: no write conflicts, no merge logic, no split-brain scenarios. One source of truth, many consumers.

## Full Example: Tauri + Pinia

Let's see all of this come together in a complete setup.

### Rust Backend (Tauri v2)

```rust
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct Settings {
    pub theme: String,
    pub font_size: u32,
    pub language: String,
}

pub struct AppState {
    pub settings: Settings,
    pub revision: u64,
}

#[tauri::command]
pub fn get_settings(state: State<'_, Mutex<AppState>>) -> serde_json::Value {
    let s = state.lock().unwrap(); // simplified — production code should handle poisoned mutex
    serde_json::json!({
        "revision": s.revision.to_string(),
        "data": s.settings,
    })
}

#[tauri::command]
pub fn update_settings(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    settings: Settings,
    source_window: String,
) -> Result<(), String> {
    let mut s = state.lock().unwrap(); // simplified for brevity
    s.settings = settings;
    s.revision += 1;

    app.emit("state-sync:invalidation", serde_json::json!({
        "topic": "settings",
        "revision": s.revision.to_string(),
        "sourceId": source_window, // enables self-echo filtering via shouldRefresh
    })).map_err(|e| e.to_string())
}
```

To wire these up, add `.invoke_handler(tauri::generate_handler![get_settings, update_settings])` and `.manage(Mutex::new(AppState { ... }))` to your Tauri builder. See the [full example on GitHub](https://github.com/777genius/state-sync).

### Frontend (Vue + Pinia)

```typescript
// Production wrapper — adds lifecycle cleanup and omitKeys vs. the minimal example above
import { createTauriRevisionSync } from '@statesync/tauri';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from './stores/settings';
import type { Settings } from './types';

export async function setupSettingsSync() {
  const store = useSettingsStore();

  const handle = createTauriRevisionSync<Settings>({
    topic: 'settings',
    listen,
    invoke,
    eventName: 'state-sync:invalidation',
    commandName: 'get_settings',
    applier: createPiniaSnapshotApplier(store, {
      mode: 'patch',
      omitKeys: ['isSettingsPanelOpen'],
    }),
    onError(ctx) {
      console.error(`[settings-sync] ${ctx.phase}:`, ctx.error);
    },
  });

  await handle.start();
  window.addEventListener('beforeunload', () => handle.stop());

  return handle;
}
```

Every window calls `setupSettingsSync()` on mount. When any window updates settings via `invoke('update_settings', ...)`, all windows sync automatically. Late joiners get the current state on `start()`. The `omitKeys` option keeps local UI flags (like "is the settings panel open") out of sync.

## Framework-Agnostic via Structural Typing

Every adapter defines a minimal structural interface instead of importing the framework:

```typescript
// From @statesync/pinia — no Pinia import!
export interface PiniaStoreLike<State extends Record<string, unknown>> {
  $id?: string;
  $state: State;
  $patch(patch: Partial<State> | ((state: State) => void)): void;
}
```

This means zero runtime dependency on Pinia, Zustand, or any other library. It also means adapters are trivially testable with plain objects. And the applier swap is a one-line change — the rest of the sync config stays the same:

```typescript
// Pinia
const applier = createPiniaSnapshotApplier(piniaStore);

// Zustand — only this line changes
const applier = createZustandSnapshotApplier(zustandStore);
```

Five framework adapters are available: **Pinia**, **Zustand**, **Valtio**, **Svelte**, and **Vue** (reactive + ref). The Tauri transport adapter handles event subscription and snapshot fetching.

The core engine is **~3 KB gzipped**. Each adapter adds **~0.8 KB**.

## Getting Started

```bash
npm install @statesync/core @statesync/tauri @statesync/pinia
# or with your framework adapter of choice:
# npm install @statesync/core @statesync/tauri @statesync/zustand
```

If you need retry logic for flaky IPC calls, drop down to the core API and wrap the provider:

```typescript
import { createRevisionSync, withRetry } from '@statesync/core';
import { createTauriInvalidationSubscriber, createTauriSnapshotProvider } from '@statesync/tauri';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

const handle = createRevisionSync<Settings>({
  topic: 'settings',
  subscriber: createTauriInvalidationSubscriber({ listen, eventName: 'state-sync:invalidation' }),
  provider: withRetry(
    createTauriSnapshotProvider({ invoke, commandName: 'get_settings' }),
    { maxAttempts: 3, initialDelayMs: 500 },
  ),
  applier: createPiniaSnapshotApplier(store, { mode: 'patch' }),
});
```

For offline persistence, the `@statesync/persistence` package adds localStorage/IndexedDB caching with compression, schema migration, and cross-tab sync via BroadcastChannel.

## When to Use state-sync (and When Not To)

**Good fit:**
- Multi-window Tauri apps syncing settings, auth state, theme, user preferences
- Any scenario with a single source of truth (backend) and multiple consumers (windows/tabs)
- Projects using any of the supported frameworks (or plain JS — the core has no framework dependency)

**Not the right tool:**
- **Collaborative editing** (Google Docs-style) — you need CRDTs like Yjs or Automerge
- **Single-window apps** — no sync needed
- **High-frequency realtime data** (games, trading tickers) — state-sync is designed for UI state, not 60fps data streams

For most desktop apps with multiple windows, the invalidation-pull model hits the sweet spot: simple enough to reason about, resilient enough for production.

---

The best state synchronization is the kind that doesn't send data in events. It sends a signal — and lets the consumer pull what it needs, when it needs it.

state-sync is MIT-licensed, has 370+ tests, and the core is ~3 KB gzipped. If you're building a multi-window Tauri app, give it a look.

**Links:**
- [GitHub](https://github.com/777genius/state-sync)
- [npm: @statesync/core](https://www.npmjs.com/package/@statesync/core)
- [Documentation](/)
