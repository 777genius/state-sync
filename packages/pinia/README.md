# state-sync-pinia

Pinia adapter for state-sync. Applies snapshots to a Pinia store.

## Install

```bash
npm install state-sync-pinia state-sync
```

## Quick Start

```typescript
import { createRevisionSync } from 'state-sync';
import { createPiniaSnapshotApplier } from 'state-sync-pinia';

const store = useMyStore();

const applier = createPiniaSnapshotApplier(store);

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: mySubscriber,
  provider: myProvider,
  applier,
});

await handle.start();
```

## Modes

### Patch (default)

```typescript
const applier = createPiniaSnapshotApplier(store);
// Calls store.$patch(data) — merges fields
```

### Replace

```typescript
const applier = createPiniaSnapshotApplier(store, { mode: 'replace' });
// Full replacement: deletes missing keys, assigns new ones
```

## Options

- `toState(data, ctx)` — map snapshot data → state patch
- `pickKeys` / `omitKeys` — limit which keys are updated
- `strict` (default: `true`) — throw if `toState` returns a non-object

See [adapter docs](../../docs/adapters/pinia.md).
