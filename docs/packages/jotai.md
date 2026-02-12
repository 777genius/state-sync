---
title: Jotai (@statesync/jotai)
---

## Installation

```bash
npm install @statesync/jotai @statesync/core
```

## Purpose

`@statesync/jotai` applies snapshots to a Jotai atom via a Jotai store. Uses the atomic updater form `store.set(atom, prev => next)` to avoid race conditions between reads and writes.

## API

`createJotaiSnapshotApplier(store, atom, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'patch' \| 'replace'` | `'patch'` | Apply strategy (see below) |
| `pickKeys` | `ReadonlyArray<keyof State>` | — | Only update these keys (mutually exclusive with `omitKeys`) |
| `omitKeys` | `ReadonlyArray<keyof State>` | — | Protect these keys from updates |
| `toState` | `(data, ctx) => Partial<State>` | identity | Map snapshot data to state shape. `ctx` contains `{ store, atom }` |
| `strict` | `boolean` | `true` | Throw if `toState` returns a non-object |

## Store interface

The adapter uses a structural interface — no `jotai` import required:

```ts
interface JotaiStoreLike<State, Atom> {
  get(atom: Atom): State;
  set(atom: Atom, value: State | ((prev: State) => State)): void;
}
```

Any store from `createStore()` in `jotai/vanilla` satisfies this interface.

## Key difference from other adapters

Jotai stores state in **individual atoms** rather than a single store object. This adapter requires both a store reference AND the target atom:

```ts
createJotaiSnapshotApplier(store, atom, options)  // 3 params
createZustandSnapshotApplier(store, options)       // 2 params
```

Jotai's `store.set` always replaces the entire atom value (no built-in shallow merge). The adapter uses the **updater form** `store.set(atom, prev => ({ ...prev, ...patch }))` for atomic read-modify-write operations.

## Apply semantics

| Mode | Behavior |
|------|----------|
| `'patch'` (default) | `store.set(atom, prev => ({ ...prev, ...patch }))` — atomic shallow merge |
| `'replace'` | `store.set(atom, prev => rebuilt)` — atomic full swap, preserving omitted keys |

## Example

```ts
import { atom, createStore } from 'jotai/vanilla';
import { createJotaiSnapshotApplier } from '@statesync/jotai';
import { createRevisionSync } from '@statesync/core';

const store = createStore();
const settingsAtom = atom({
  theme: 'light',
  locale: 'en',
  notifications: true,
  isMenuOpen: false,
});

const applier = createJotaiSnapshotApplier(store, settingsAtom, {
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

const applier = createJotaiSnapshotApplier(store, settingsAtom, {
  toState: (data: PrefsDTO) => ({
    theme: data.ui_theme,
    locale: data.ui_locale,
  }),
});
```

## See also

- [Quickstart](/guide/quickstart) — full wiring example
- [Multi-window patterns](/guide/multi-window) — cross-tab architecture
- [Writing state](/guide/writing-state) — patterns for the write path
