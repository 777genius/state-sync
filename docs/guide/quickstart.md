---
title: Quickstart
---

# Quickstart

Get state-sync running in under 5 minutes.

## Installation

```bash
# Core engine
npm install @statesync/core

# Pick a framework adapter
npm install @statesync/pinia    # Vue + Pinia
npm install @statesync/zustand  # React + Zustand
npm install @statesync/valtio   # React + Valtio
npm install @statesync/svelte   # Svelte
npm install @statesync/vue      # Vue (reactive/ref)

# Optional
npm install @statesync/tauri       # Tauri v2 transport
npm install @statesync/persistence # Offline cache + cross-tab sync
```

## Core concepts

### Topic

A **topic** is a non-empty string that identifies a piece of state (e.g., `'settings'`, `'cart'`). Each topic has its own revision counter and syncs independently.

### The three parts

| Part | Interface | Role |
|------|-----------|------|
| **Subscriber** | `{ subscribe(handler) => unsubscribe }` | Delivers invalidation events |
| **Provider** | `{ getSnapshot() => SnapshotEnvelope }` | Returns the latest state |
| **Applier** | `{ apply(snapshot) => void }` | Writes state into your store |

## Basic example

```typescript
import { createRevisionSync, createConsoleLogger } from '@statesync/core';

interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
}

// Subscriber: listens for invalidation events
const subscriber = {
  async subscribe(handler) {
    const channel = new BroadcastChannel('settings-sync');
    channel.onmessage = (e) => handler(e.data);
    return () => channel.close();
  }
};

// Provider: fetches the latest snapshot
const provider = {
  async getSnapshot() {
    const res = await fetch('/api/settings');
    return res.json(); // { revision: "42", data: { theme, language } }
  }
};

// Applier: updates local state
let localState: AppSettings = { theme: 'light', language: 'en' };
const applier = {
  apply(snapshot) {
    localState = snapshot.data;
  }
};

const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier,
  logger: createConsoleLogger({ debug: true }),
});

await sync.start();
```

## With Pinia (Vue)

```typescript
import { createRevisionSync } from '@statesync/core';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { useSettingsStore } from './stores/settings';

const store = useSettingsStore();

const sync = createRevisionSync({
  topic: 'settings',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: createPiniaSnapshotApplier(store, {
    mode: 'patch',
    omitKeys: ['isLoading'], // Don't sync UI state
  }),
});

await sync.start();
```

## With Zustand (React)

```typescript
import { createRevisionSync } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import { useSettingsStore } from './stores/settings';

const sync = createRevisionSync({
  topic: 'settings',
  subscriber: mySubscriber,
  provider: myProvider,
  applier: createZustandSnapshotApplier(useSettingsStore, {
    mode: 'patch',
    omitKeys: ['isLoading'],
  }),
});

await sync.start();
```

## With Tauri

```typescript
import { createTauriRevisionSync } from '@statesync/tauri';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

const sync = createTauriRevisionSync({
  topic: 'settings',
  listen,
  invoke,
  eventName: 'settings:invalidated',
  commandName: 'get_settings',
  applier: myApplier,
});

await sync.start();
```

::: tip Complete Tauri setup
This is frontend-only. For the full Rust backend + TypeScript frontend example, see [Vue + Pinia + Tauri](/examples/vue-pinia-tauri).
:::

## Stopping sync

```typescript
sync.stop();
// After stop(), the handle is dead — create a new one to restart
```

## Next steps

- [Protocol](/guide/protocol) — how revision-based sync works
- [Writing state](/guide/writing-state) — UI-to-backend write patterns
- [Multi-window patterns](/guide/multi-window) — multi-tab and multi-window setups
- [Lifecycle](/lifecycle) — API reference for `RevisionSyncHandle`
- [Examples](/examples/) — runnable code samples
