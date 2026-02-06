---
title: Valtio (@statesync/valtio)
---

## Installation

```bash
npm install @statesync/valtio @statesync/core
```

## Purpose

`@statesync/valtio` applies snapshots to a Valtio proxy. Mutates the proxy **in place** — the reference never changes, so `useSnapshot()` and `subscribe()` keep working.

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

const sync = createRevisionSync({
  topic: 'app-config',
  subscriber,
  provider,
  applier,
});

await sync.start();
```

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
- [Writing state](/guide/writing-state) — patterns for the write path
```

::: tip Why not replace the proxy?
Valtio's reactivity relies on the original proxy reference. Replacing it would break all `useSnapshot()` hooks. The adapter always mutates in place.
:::
