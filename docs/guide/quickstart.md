---
title: Quickstart
---

# Quickstart

Get state-sync running in 5 minutes.

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

# Pick a transport (optional)
npm install @statesync/tauri    # Tauri v2
```

## Core concepts

### Topic

A **topic** is a unique string identifier for a piece of state you want to sync (e.g., `'settings'`, `'cart'`, `'user-preferences'`). Each topic has its own revision counter and can be synced independently.

### The three parts

You need 3 parts to sync state:

| Part | Role | Example |
|------|------|---------|
| **Subscriber** | Listens for "state changed" events | Tauri event listener, BroadcastChannel |
| **Provider** | Fetches full state snapshot | Tauri invoke, HTTP API |
| **Applier** | Updates local state | Pinia store, Zustand store |

## Basic example

```typescript
import { createRevisionSync, createConsoleLogger } from '@statesync/core';

// 1. Define your state type
interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
}

// 2. Create subscriber (listens for invalidation events)
const subscriber = {
  async subscribe(handler) {
    // Example: BroadcastChannel
    const channel = new BroadcastChannel('settings-sync');
    channel.onmessage = (e) => handler(e.data);
    return () => channel.close();
  }
};

// 3. Create provider (fetches snapshots)
const provider = {
  async getSnapshot() {
    const response = await fetch('/api/settings');
    return response.json(); // { revision: "123", data: { theme, language } }
  }
};

// 4. Create applier (updates local state)
let localState: AppSettings = { theme: 'light', language: 'en' };
const applier = {
  apply(snapshot) {
    localState = snapshot.data;
    console.log('State updated:', localState);
  }
};

// 5. Wire it together
const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier,
  logger: createConsoleLogger({ debug: true }),
});

// 6. Start sync
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
// When component unmounts or app closes
sync.stop();

// Note: After stop(), the handle is "dead"
// Create a new handle if you need to restart
```

## Next steps

- [Protocol (mental model)](/guide/protocol) — understand how revision-based sync works
- [Multi-window patterns](/guide/multi-window) — best practices for multi-window apps
- [Lifecycle](/lifecycle) — detailed API reference
- [Examples](/examples/) — runnable code samples
