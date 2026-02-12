[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteStoreLike

# Interface: SvelteStoreLike\<State\>

Defined in: [svelte.ts:27](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/svelte/src/svelte.ts#L27)

Minimal structural interface for a Svelte writable store.

We intentionally avoid importing `svelte/store` types so this adapter stays
dependency-free (from Svelte) and can be used in any environment.

The real Svelte writable store implements:
- `set(value)` -- replaces the store value entirely
- `update(updater)` -- derives the next value from the current one
- `subscribe(callback)` -- not needed for applying snapshots

Any object that satisfies this shape (e.g. a custom store wrapper) is accepted
by createSvelteSnapshotApplier.

## Example

```ts
import { writable } from 'svelte/store';

interface AppState { count: number; name: string }
const myStore: SvelteStoreLike<AppState> = writable({ count: 0, name: '' });
```

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` | The shape of the store value. |

## Methods

### set()

```ts
set(value): void;
```

Defined in: [svelte.ts:33](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/svelte/src/svelte.ts#L33)

Replaces the store value with the given value, triggering all subscribers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `State` | The new store value. |

#### Returns

`void`

***

### update()

```ts
update(updater): void;
```

Defined in: [svelte.ts:39](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/svelte/src/svelte.ts#L39)

Derives the next store value from the current one using the provided updater function.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `updater` | (`current`) => `State` | A pure function that receives the current value and returns the next value. |

#### Returns

`void`
