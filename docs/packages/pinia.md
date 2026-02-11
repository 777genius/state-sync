---
title: Pinia (@statesync/pinia)
---

## Installation

```bash
npm install @statesync/pinia @statesync/core
```

## Purpose

`@statesync/pinia` applies snapshots to a Pinia store. No hard dependency on `pinia` at runtime — uses a structural interface (`PiniaStoreLike`).

## API

`createPiniaSnapshotApplier(store, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'patch' \| 'replace'` | `'patch'` | Apply strategy (see below) |
| `pickKeys` | `ReadonlyArray<keyof State>` | — | Only update these keys (mutually exclusive with `omitKeys`) |
| `omitKeys` | `ReadonlyArray<keyof State>` | — | Protect these keys from updates |
| `toState` | `(data, ctx) => Partial<State>` | identity | Map snapshot data to store state shape. `ctx` contains `{ store }` |
| `strict` | `boolean` | `true` | Throw if `toState` returns a non-object |

## Store interface

The adapter uses a structural interface — no `pinia` import required:

```ts
interface PiniaStoreLike<State> {
  $id?: string;
  $state: State;
  $patch(patch: Partial<State> | ((state: State) => void)): void;
}
```

Any Pinia store created via `defineStore()` satisfies this interface automatically.

## Apply semantics

| Mode | Behavior | When to use |
|------|----------|-------------|
| `'patch'` (default) | `store.$patch(filteredPatch)` — non-destructive merge | Store has ephemeral/UI state that should survive |
| `'replace'` | `store.$patch((state) => { delete staleKeys; assign newKeys })` | Snapshot is authoritative full state |

::: tip Replace mode details
In replace mode the adapter uses `$patch()` with a mutator function to delete stale keys and assign new ones. This is more reliable than assigning `$state` directly, which Pinia documents as internally calling `$patch()` anyway.
:::

## Example

```ts
import { createRevisionSync } from '@statesync/core';
import { createPiniaSnapshotApplier } from '@statesync/pinia';
import { useSettingsStore } from './stores/settings';

const store = useSettingsStore();

const applier = createPiniaSnapshotApplier(store, {
  mode: 'patch',
  omitKeys: ['isLoading', 'error'],
});

const sync = createRevisionSync({
  topic: 'settings',
  subscriber,
  provider,
  applier,
});

await sync.start();
```

### With toState mapping

When snapshot data shape differs from store state:

```ts
interface BackendSettings {
  theme: string;
  locale: string;
  featureFlags: Record<string, boolean>;
}

const applier = createPiniaSnapshotApplier(store, {
  toState: (data: BackendSettings, { store }) => ({
    theme: data.theme,
    locale: data.locale,
    flags: data.featureFlags,
  }),
});
```

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Vue + Pinia + Tauri example](/examples/vue-pinia-tauri) — complete Tauri app
- [Writing state](/guide/writing-state) — patterns for the write path
