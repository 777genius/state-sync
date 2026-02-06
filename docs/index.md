---
layout: home
hero:
  name: state-sync
  text: Reliable state synchronization between windows/processes
  tagline: Revision-based ordering • Multi-framework • Persistence & cross-tab sync
  actions:
    - theme: brand
      text: Quickstart
      link: /guide/quickstart
    - theme: alt
      text: Examples
      link: /examples/
    - theme: alt
      text: Comparison
      link: /comparison
features:
  - title: Revision-based ordering
    details: Monotonic revisions ensure updates apply in correct order. Stale events are automatically rejected.
  - title: Multi-framework
    details: Official adapters for Pinia, Zustand, Valtio, Svelte, and Vue. Works with any state management.
  - title: Persistence & caching
    details: localStorage, IndexedDB, schema migrations, compression, TTL. Cross-tab sync via BroadcastChannel.
  - title: Transport-agnostic
    details: Tauri events, BroadcastChannel, WebSocket, or custom. Subscriber/provider pattern fits any transport.
  - title: Production-ready
    details: Throttling, retry with backoff, structured error handling by phase, comprehensive logging.
  - title: Tiny footprint
    details: Core is 3.1KB gzipped. Framework adapters are ~0.8KB each. No bloat.
---

## Install

```bash
# Core engine (required)
npm install @statesync/core

# Persistence (optional - caching, migrations, cross-tab sync)
npm install @statesync/persistence

# Framework adapter (pick one)
npm install @statesync/pinia    # Vue + Pinia
npm install @statesync/zustand  # React + Zustand
npm install @statesync/valtio   # React + Valtio
npm install @statesync/svelte   # Svelte
npm install @statesync/vue      # Vue (reactive/ref)

# Transport adapter (optional)
npm install @statesync/tauri    # Tauri v2
```

## Quick example

```typescript
import { createRevisionSync } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import { createPersistenceApplier, createLocalStorageBackend } from '@statesync/persistence';

// Storage with cross-tab sync
const storage = createLocalStorageBackend({ key: 'my-state' });

// Applier with persistence
const applier = createPersistenceApplier({
  storage,
  applier: createZustandSnapshotApplier(useMyStore),
  throttling: { debounceMs: 300 },
  crossTabSync: { channelName: 'my-sync' },
});

// Sync engine
const sync = createRevisionSync({
  topic: 'my-topic',
  subscriber,
  provider,
  applier,
});

await sync.start();
```

## Why state-sync?

Most state sync libraries broadcast full state on every change. This breaks when:

- Events arrive **out of order** (common in multi-window apps)
- Multiple windows make **concurrent updates**
- You need **persistence** with cache invalidation

state-sync solves this with a simple pattern:

```
Backend: state changed → emit { topic, revision }
    ↓
Window: receive event → fetch snapshot → revision > local? → apply
```

Stale updates are rejected. Rapid events are coalesced. State stays consistent.

[Learn more →](/guide/protocol)
