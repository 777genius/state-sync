[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / SvelteStoreLike

# Interface: SvelteStoreLike\<State\>

Defined in: svelte.ts:14

Minimal structural interface for a Svelte writable store.

We intentionally avoid importing `svelte/store` types so this adapter stays
dependency-free (from Svelte) and can be used in any environment.

The real Svelte writable store implements:
- `set(value)`
- `update(updater)`
- `subscribe(callback)`  (not needed for applying snapshots)

## Type Parameters

| Type Parameter |
| ------ |
| `State` |

## Methods

### set()

```ts
set(value): void;
```

Defined in: svelte.ts:15

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `State` |

#### Returns

`void`

***

### update()

```ts
update(updater): void;
```

Defined in: svelte.ts:16

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `updater` | (`current`) => `State` |

#### Returns

`void`
