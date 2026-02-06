# @statesync/svelte

Svelte adapter for state-sync. Applies snapshots to a Svelte writable store.

## Install

```bash
npm install @statesync/svelte @statesync/core
```

## Quick Start

```typescript
import { createRevisionSync } from '@statesync/core';
import { createSvelteSnapshotApplier } from '@statesync/svelte';
import { writable } from 'svelte/store';

const settings = writable({ theme: 'light', lang: 'en' });

const applier = createSvelteSnapshotApplier(settings);

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
const applier = createSvelteSnapshotApplier(store);
// Calls store.update(current => ({ ...current, ...patch }))
```

### Replace

```typescript
const applier = createSvelteSnapshotApplier(store, { mode: 'replace' });
// Full replacement: deletes missing keys, assigns new ones
```

## Options

- `toState(data, ctx)` — map snapshot data to state patch
- `pickKeys` / `omitKeys` — limit which keys are updated
- `strict` (default: `true`) — throw if `toState` returns a non-object

See [full documentation](https://github.com/777genius/state-sync/blob/main/docs/adapters/svelte.md).
