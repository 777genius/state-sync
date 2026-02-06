# @statesync/valtio

Valtio adapter for state-sync. Applies snapshots to a Valtio proxy.

## Install

```bash
npm install @statesync/valtio @statesync/core
```

## Quick Start

```typescript
import { createRevisionSync } from '@statesync/core';
import { createValtioSnapshotApplier } from '@statesync/valtio';
import { proxy } from 'valtio';

const state = proxy({ theme: 'light', lang: 'en' });

const applier = createValtioSnapshotApplier(state);

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
const applier = createValtioSnapshotApplier(state);
// Assigns filtered keys directly on the proxy
```

### Replace

```typescript
const applier = createValtioSnapshotApplier(state, { mode: 'replace' });
// Deletes allowed keys not in new state, then assigns new keys
```

## Notes

- The proxy reference is never replaced — mutations are applied directly
- Existing Valtio subscribers (useSnapshot) continue to work

## Options

- `toState(data, ctx)` — map snapshot data to state patch
- `pickKeys` / `omitKeys` — limit which keys are updated
- `strict` (default: `true`) — throw if `toState` returns a non-object

See [full documentation](https://github.com/777genius/state-sync/blob/main/docs/adapters/valtio.md).
