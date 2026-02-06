---
title: Custom transports
---

# Custom transports

state-sync is transport-agnostic. You provide two things:

| Part | Interface | What it does |
|------|-----------|-------------|
| **Subscriber** | `{ subscribe(handler) → unsubscribe }` | Listens for invalidation events |
| **Provider** | `{ getSnapshot() → SnapshotEnvelope }` | Fetches current state |

## WebSocket

```typescript
import { createRevisionSync } from '@statesync/core';

const subscriber = {
  async subscribe(handler: (event: { topic: string; revision: string }) => void) {
    const ws = new WebSocket('wss://api.example.com/sync');

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);
      handler(event); // { topic: 'settings', revision: '42' }
    };

    // Return cleanup function
    return () => ws.close();
  },
};

const provider = {
  async getSnapshot() {
    const res = await fetch('https://api.example.com/settings');
    return res.json(); // { revision: '42', data: { theme: 'dark' } }
  },
};

const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier: myApplier,
});
```

## Server-Sent Events (SSE)

```typescript
const subscriber = {
  async subscribe(handler) {
    const source = new EventSource('/api/events');

    source.addEventListener('invalidation', (e) => {
      handler(JSON.parse(e.data));
    });

    return () => source.close();
  },
};
```

## Electron IPC

```typescript
// In renderer process
import { ipcRenderer } from 'electron';

const subscriber = {
  async subscribe(handler) {
    const listener = (_event, data) => handler(data);
    ipcRenderer.on('state:invalidated', listener);
    return () => ipcRenderer.removeListener('state:invalidated', listener);
  },
};

const provider = {
  async getSnapshot() {
    return ipcRenderer.invoke('get-state');
  },
};
```

## BroadcastChannel (browser tabs)

```typescript
const channel = new BroadcastChannel('my-sync');

const subscriber = {
  async subscribe(handler) {
    const listener = (e: MessageEvent) => handler(e.data);
    channel.addEventListener('message', listener);
    return () => channel.removeEventListener('message', listener);
  },
};
```

## Handling reconnection

state-sync does not manage transport connections. If your WebSocket reconnects, call `sync.refresh()` to re-fetch the latest snapshot:

```typescript
ws.onopen = () => {
  // Re-sync after reconnect
  sync.refresh();
};
```

## Filtering events with shouldRefresh

Skip unnecessary refreshes by providing a `shouldRefresh` callback:

```typescript
const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier,
  shouldRefresh(event) {
    // Skip if this window originated the change
    return event.sourceId !== myWindowId;
  },
});
```

## See also

- [How state-sync works](/guide/protocol) — the invalidation-pull protocol
- [Source of truth example](/examples/source-of-truth) — in-memory transport demo
- [Multi-window patterns](/guide/multi-window) — BroadcastChannel + Tauri examples
