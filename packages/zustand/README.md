# @statesync/zustand

Zustand adapter for state-sync. Applies snapshots to a Zustand store.

## Install

```bash
npm install @statesync/zustand @statesync/core
```

## Quick Start

```typescript
import { createRevisionSync } from '@statesync/core';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import { create } from 'zustand';

const useSettingsStore = create(() => ({
  theme: 'light',
  lang: 'en',
}));

const applier = createZustandSnapshotApplier(useSettingsStore);

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
const applier = createZustandSnapshotApplier(store);
// Calls store.setState(partial) — non-destructive merge
```

### Replace

```typescript
const applier = createZustandSnapshotApplier(store, { mode: 'replace' });
// Calls store.setState(nextState, true) — atomic swap
```

## Options

- `toState(data, ctx)` — map snapshot data to state patch
- `pickKeys` / `omitKeys` — limit which keys are updated
- `strict` (default: `true`) — throw if `toState` returns a non-object

See [full documentation](https://github.com/777genius/state-sync/blob/main/docs/adapters/zustand.md).
