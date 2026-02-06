# @statesync/core

Core state synchronization library. Framework- and transport-agnostic.

## Install

```bash
npm install @statesync/core
```

## Quick Start

```typescript
import { createConsoleLogger, createRevisionSync } from '@statesync/core';

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: myInvalidationSubscriber,
  provider: mySnapshotProvider,
  applier: {
    apply(snapshot) {
      console.log('New data:', snapshot.data);
    },
  },
  onError(ctx) {
    console.error(`[${ctx.phase}]`, ctx.error);
  },
  logger: createConsoleLogger({ debug: true }),
});

await handle.start();

// Later:
handle.stop();
```

## API

### `createRevisionSync<T>(options): RevisionSyncHandle`

Creates a sync handle for the given topic.

**Options**:
- `topic` — resource identifier (`string`)
- `subscriber` — invalidation event source
- `provider` — snapshot provider
- `applier` — applies snapshots to local state
- `shouldRefresh?` — filter: whether to refresh for a specific event
- `logger?` — optional logger
- `onError?` — error callback

**Handle**:
- `start()` — subscribe and load the initial snapshot
- `stop()` — unsubscribe and block further apply
- `refresh()` — one-shot fetch + apply
- `getLocalRevision()` — current local revision

See the [lifecycle contract](https://github.com/777genius/state-sync/blob/main/docs/lifecycle.md).
