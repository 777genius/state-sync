---
title: Valtio (@statesync/valtio)
---

## Purpose

`@statesync/valtio` is a **framework adapter**: it knows how to apply snapshots to a Valtio proxy.

## API

- `createValtioSnapshotApplier(proxy, options?)`
  - `mode: 'patch' | 'replace'`
  - `pickKeys` / `omitKeys` — protect local/ephemeral fields
  - `toState(data, ctx)` — map snapshot data to state shape
  - `strict` — throw on invalid mapping (default: `true`)

## Proxy interface

The adapter uses a type alias — no `valtio` import required:

```ts
type ValtioProxyLike<State> = State;
```

Any object created via `proxy()` satisfies this interface. The adapter mutates the proxy **in place** — the reference never changes, so existing Valtio subscribers (`useSnapshot`, `subscribe`) continue to work.

## Apply semantics

| Mode | Behavior |
|------|----------|
| `'patch'` (default) | `proxy[key] = value` for each filtered key — direct mutation |
| `'replace'` | `delete proxy[key]` for stale keys, then `proxy[key] = value` — proxy reference stays the same |

## Example

```ts
import { createRevisionSync } from '@statesync/core';
import { createValtioSnapshotApplier } from '@statesync/valtio';
import { proxy } from 'valtio';

const state = proxy({ count: 0, name: 'world' });

const applier = createValtioSnapshotApplier(state, {
  mode: 'patch',
  omitKeys: ['localUiFlag'],
});

const handle = createRevisionSync({
  topic: 'app-config',
  subscriber,
  provider,
  applier,
});

await handle.start();
```

See: [Valtio adapter notes](/adapters/valtio).
