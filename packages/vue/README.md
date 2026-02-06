# @statesync/vue

Vue adapter for state-sync. Applies snapshots to Vue reactive objects or refs.

## Install

```bash
npm install @statesync/vue @statesync/core
```

## Quick Start

### With reactive()

```typescript
import { createRevisionSync } from '@statesync/core';
import { createVueSnapshotApplier } from '@statesync/vue';
import { reactive } from 'vue';

const state = reactive({ theme: 'light', lang: 'en' });

const applier = createVueSnapshotApplier(state);

const handle = createRevisionSync({
  topic: 'settings',
  subscriber: mySubscriber,
  provider: myProvider,
  applier,
});

await handle.start();
```

### With ref()

```typescript
import { ref } from 'vue';
import { createVueSnapshotApplier } from '@statesync/vue';

const settings = ref({ theme: 'light', lang: 'en' });

const applier = createVueSnapshotApplier(settings, { target: 'ref' });
```

## Modes

### Patch (default)

```typescript
const applier = createVueSnapshotApplier(state);
// Merges snapshot fields into existing state
```

### Replace

```typescript
const applier = createVueSnapshotApplier(state, { mode: 'replace' });
// Full replacement: deletes missing keys, assigns new ones
```

## Options

- `target` — `'reactive'` (default) or `'ref'`
- `toState(data, ctx)` — map snapshot data to state patch
- `pickKeys` / `omitKeys` — limit which keys are updated
- `strict` (default: `true`) — throw if `toState` returns a non-object

See [full documentation](https://github.com/777genius/state-sync/blob/main/docs/adapters/vue.md).
