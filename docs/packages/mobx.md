---
title: MobX (@statesync/mobx)
---

## Installation

```bash
npm install @statesync/mobx @statesync/core
```

## Purpose

`@statesync/mobx` applies snapshots to a MobX observable store. Mutates the store **in place** — the reference never changes, so `autorun`, `reaction`, and `observer()` keep working.

## API

`createMobXSnapshotApplier(store, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'patch' \| 'replace'` | `'patch'` | Apply strategy (see below) |
| `runInAction` | `(fn: () => void) => void` | — | Wraps mutations in a MobX action (pass `runInAction` from `mobx`) |
| `pickKeys` | `ReadonlyArray<keyof State>` | — | Only update these keys (mutually exclusive with `omitKeys`) |
| `omitKeys` | `ReadonlyArray<keyof State>` | — | Protect these keys from updates |
| `toState` | `(data, ctx) => Partial<State>` | identity | Map snapshot data to state shape. `ctx` contains `{ store }` |
| `strict` | `boolean` | `true` | Throw if `toState` returns a non-object |

## Store interface

The adapter uses a type alias — no `mobx` import required:

```ts
type MobXStoreLike<State> = State;
```

Any MobX observable (class with `makeAutoObservable`, object from `observable()`) satisfies this.

## runInAction

MobX requires mutations inside `action` or `runInAction` when `enforceActions` is `'always'` or `'observed'`. Pass `runInAction` from `mobx` to ensure compatibility:

```ts
import { runInAction } from 'mobx';

const applier = createMobXSnapshotApplier(store, { runInAction });
```

All property assignments happen inside a **single** `runInAction` call, so MobX batches updates and triggers reactions once.

When omitted, the adapter assigns keys directly — this works when `enforceActions` is `'never'`, but will throw if strict mode is enabled.

## Apply semantics

| Mode | Behavior |
|------|----------|
| `'patch'` (default) | `store[key] = value` for each filtered key inside `runInAction` |
| `'replace'` | `delete store[key]` for stale keys, then `store[key] = value` — all inside a single `runInAction` |

::: tip Why not replace the store?
MobX's reactivity relies on the original observable reference. Replacing it would break all `autorun` and `observer()` subscriptions. The adapter always mutates in place.
:::

::: warning Replace mode and class instances
Replace mode uses `delete` to remove stale keys. This works well with plain observables (`observable({})`), but may behave unexpectedly with class instances where properties are defined on the prototype. For class-based stores, prefer `'patch'` mode.
:::

## Example

```ts
import { makeAutoObservable, runInAction } from 'mobx';
import { createMobXSnapshotApplier } from '@statesync/mobx';
import { createRevisionSync } from '@statesync/core';

class SettingsStore {
  theme = 'light';
  locale = 'en';
  notifications = true;
  isMenuOpen = false;

  constructor() { makeAutoObservable(this); }
}

const store = new SettingsStore();

const applier = createMobXSnapshotApplier(store, {
  runInAction,
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

const applier = createMobXSnapshotApplier(store, {
  runInAction,
  toState: (data: PrefsDTO, { store }) => ({
    theme: data.ui_theme,
    locale: data.ui_locale,
  }),
});
```

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
- [Writing state](/guide/writing-state) — patterns for the write path
