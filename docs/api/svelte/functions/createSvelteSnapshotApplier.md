[**@statesync/svelte**](../index.md)

***

[@statesync/svelte](../index.md) / createSvelteSnapshotApplier

# Function: createSvelteSnapshotApplier()

Implementation.

## Call Signature

```ts
function createSvelteSnapshotApplier<State, Data>(store, options?): SnapshotApplier<Data>;
```

Defined in: [svelte.ts:106](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/svelte/src/svelte.ts#L106)

Creates a SnapshotApplier that applies snapshots into a Svelte writable store.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - |
| `Data` | `State` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `store` | [`SvelteStoreLike`](../interfaces/SvelteStoreLike.md)\<`State`\> |
| `options?` | [`SvelteStoreSnapshotApplierOptions`](../type-aliases/SvelteStoreSnapshotApplierOptions.md)\<`State`, `Data`\> |

### Returns

`SnapshotApplier`\<`Data`\>

## Call Signature

```ts
function createSvelteSnapshotApplier<State, Data>(state, options): SnapshotApplier<Data>;
```

Defined in: [svelte.ts:117](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/svelte/src/svelte.ts#L117)

Creates a SnapshotApplier that applies snapshots into a Svelte 5 `$state` proxy.

Mutates the state object in-place (property assignment / delete),
which is how Svelte 5 fine-grained reactivity tracks changes.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - |
| `Data` | `State` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `State` |
| `options` | [`SvelteStateSnapshotApplierOptions`](../type-aliases/SvelteStateSnapshotApplierOptions.md)\<`State`, `Data`\> |

### Returns

`SnapshotApplier`\<`Data`\>
