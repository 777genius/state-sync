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
  - title: Resilient
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

## Do you need state-sync?

**Yes, if you have:**

| Scenario | Problem state-sync solves |
|----------|---------------------------|
| Multi-window app (Tauri, Electron) | State diverges between windows |
| Multiple browser tabs | User edits in tab A, tab B shows stale data |
| Backend pushes state updates | Events arrive out of order, UI flickers |
| State must survive reload | Need persistence with proper invalidation |

**No, if you have:**

- Single-window app with no persistence needs
- Simple localStorage that never syncs with backend
- Already using a solution like TanStack Query for server state

## How it works

```
Backend: state changed → emit { topic, revision }
    ↓
Window: receive event → fetch snapshot → revision > local? → apply
```

Stale updates are rejected. Rapid events are merged. State stays consistent. [Learn more →](/guide/protocol)

## Quick example

Sync a Zustand store across browser tabs with persistence:

```typescript
import { createRevisionSync } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';

// 1. Listen for "state changed" events from other tabs
const channel = new BroadcastChannel('my-sync');
const subscriber = {
  async subscribe(handler) {
    channel.onmessage = (e) => handler(e.data);
    return () => channel.close();
  },
};

// 2. Fetch current state
const provider = {
  async getSnapshot() {
    const raw = localStorage.getItem('my-state');
    return raw ? JSON.parse(raw) : { revision: '0', data: {} };
  },
};

// 3. Wire it together
const sync = createRevisionSync({
  topic: 'my-state',
  subscriber,
  provider,
  applier: createZustandSnapshotApplier(useMyStore),
});

await sync.start();
```

[Full Quickstart →](/guide/quickstart)
