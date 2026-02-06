---
title: Examples
---

# Examples

Production-ready examples demonstrating state-sync patterns.

## Framework examples

| Example | Stack | Description |
|---------|-------|-------------|
| [React + Zustand](/examples/react-zustand) | React, Zustand, BroadcastChannel | Shopping cart synced across browser tabs |
| [Vue + Pinia + Tauri](/examples/vue-pinia-tauri) | Vue 3, Pinia, Tauri v2 | Settings panel synced across Tauri windows |

## Core patterns

| Example | Description |
|---------|-------------|
| [Source of truth](/examples/source-of-truth) | In-memory transport, revision gate, invalidation cycle |
| [Structured logging](/examples/structured-logging) | JSON logger, error metrics, observability |
| [Error handling & retry](/examples/error-handling) | Graceful degradation, automatic retry, UI indicators |
| [Persistence with migrations](/examples/persistence-migration) | Schema versioning, data migration, validation |

## Quick reference

### Minimal setup

```typescript
import { createRevisionSync } from '@statesync/core';

const sync = createRevisionSync({
  topic: 'my-topic',
  subscriber: { subscribe: (handler) => { /* ... */ } },
  provider: { getSnapshot: () => { /* ... */ } },
  applier: { apply: (snapshot) => { /* ... */ } },
});

await sync.start();
```

### With Zustand

```typescript
import { createZustandSnapshotApplier } from '@statesync/zustand';

const applier = createZustandSnapshotApplier(useMyStore, {
  mode: 'patch',
  omitKeys: ['isLoading'],
});
```

### With Pinia

```typescript
import { createPiniaSnapshotApplier } from '@statesync/pinia';

const applier = createPiniaSnapshotApplier(myStore, {
  mode: 'patch',
  omitKeys: ['isLoading'],
});
```

### With Tauri

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
  applier,
});
```

### With persistence

```typescript
import { createPersistenceApplier, createLocalStorageBackend } from '@statesync/persistence';

const storage = createLocalStorageBackend({ key: 'my-state' });

const applier = createPersistenceApplier({
  storage,
  applier: innerApplier,
  throttling: { debounceMs: 300 },
  crossTabSync: { channelName: 'my-sync' },
});
```

## Running examples locally

```bash
# Clone the repo
git clone https://github.com/777genius/state-sync.git
cd state-sync

# Install dependencies
pnpm install

# Run TypeScript examples
npx tsx docs/examples/source-of-truth.ts
npx tsx docs/examples/structured-logging.ts
```

## Contributing examples

Have a useful pattern? [Open a PR](https://github.com/777genius/state-sync/pulls) to add it to the examples!
