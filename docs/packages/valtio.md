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

`createValtioSnapshotApplier(proxy, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'patch' \| 'replace'` | `'patch'` | Apply strategy (see below) |
| `pickKeys` | `ReadonlyArray<keyof State>` | — | Only update these keys (mutually exclusive with `omitKeys`) |
| `omitKeys` | `ReadonlyArray<keyof State>` | — | Protect these keys from updates |
| `toState` | `(data, ctx) => Partial<State>` | identity | Map snapshot data to state shape. `ctx` contains `{ proxy }` |
| `strict` | `boolean` | `true` | Throw if `toState` returns a non-object |

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

::: tip Why not replace the proxy?
Valtio's reactivity relies on the original proxy reference. Replacing it would break all `useSnapshot()` hooks. The adapter always mutates in place.
:::

## Example

```ts
import { createRevisionSync } from '@statesync/core';
import { createValtioSnapshotApplier } from '@statesync/valtio';
import { proxy } from 'valtio';

const state = proxy({
  theme: 'light',
  locale: 'en',
  notifications: true,
  isMenuOpen: false,
});

const applier = createValtioSnapshotApplier(state, {
  mode: 'patch',
  omitKeys: ['isMenuOpen'],
});

const sync = createRevisionSync({
  topic: 'user-prefs',
  subscriber,
  provider,
  applier,
});

await sync.start();
```

### With toState mapping

```ts
interface PrefsDTO {
  ui_theme: string;
  ui_locale: string;
}

const applier = createValtioSnapshotApplier(state, {
  toState: (data: PrefsDTO, { proxy }) => ({
    theme: data.ui_theme,
    locale: data.ui_locale,
  }),
});
```

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
- [Writing state](/guide/writing-state) — patterns for the write path
