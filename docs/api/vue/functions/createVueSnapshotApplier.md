[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / createVueSnapshotApplier

# Function: createVueSnapshotApplier()

Implementation.

## Call Signature

```ts
function createVueSnapshotApplier<State, Data>(state, options?): SnapshotApplier<Data>;
```

Defined in: [vue.ts:108](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/vue/src/vue.ts#L108)

Creates a SnapshotApplier that applies snapshots into a Vue reactive object.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - |
| `Data` | `State` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `State` |
| `options?` | [`VueReactiveSnapshotApplierOptions`](../type-aliases/VueReactiveSnapshotApplierOptions.md)\<`State`, `Data`\> |

### Returns

`SnapshotApplier`\<`Data`\>

## Call Signature

```ts
function createVueSnapshotApplier<State, Data>(ref, options): SnapshotApplier<Data>;
```

Defined in: [vue.ts:116](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/vue/src/vue.ts#L116)

Creates a SnapshotApplier that applies snapshots into a Vue ref.

### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | - |
| `Data` | `State` |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`VueRefLike`](../interfaces/VueRefLike.md)\<`State`\> |
| `options` | [`VueRefSnapshotApplierOptions`](../type-aliases/VueRefSnapshotApplierOptions.md)\<`State`, `Data`\> |

### Returns

`SnapshotApplier`\<`Data`\>
