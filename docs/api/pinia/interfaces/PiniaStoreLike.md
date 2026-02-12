[**@statesync/pinia**](../index.md)

***

[@statesync/pinia](../index.md) / PiniaStoreLike

# Interface: PiniaStoreLike\<State\>

Defined in: [pinia.ts:18](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/pinia/src/pinia.ts#L18)

Minimal structural interface that a Pinia store satisfies.

We intentionally avoid importing `pinia` types here so this adapter stays
dependency-free (from Pinia) and can be used in environments where the
`pinia` package is not installed. Any object that structurally matches this
interface — including a real `StoreGeneric` — can be passed to
[createPiniaSnapshotApplier](../functions/createPiniaSnapshotApplier.md).

The real Pinia store implements at minimum:
- `$state` — reactive state object
- `$patch(partial | mutator)` — the preferred way to batch-update state

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the store's reactive state object. |

## Properties

### $id?

```ts
optional $id: string;
```

Defined in: [pinia.ts:25](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/pinia/src/pinia.ts#L25)

Optional store identifier exposed by Pinia as `$id`.

Not used by the adapter at runtime; included for debugging and logging
convenience.

***

### $state

```ts
$state: State;
```

Defined in: [pinia.ts:33](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/pinia/src/pinia.ts#L33)

The current reactive state of the store.

Read by the adapter in `'replace'` mode to determine which keys need to
be deleted when the incoming snapshot no longer contains them.

## Methods

### $patch()

```ts
$patch(patch): void;
```

Defined in: [pinia.ts:46](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/pinia/src/pinia.ts#L46)

Applies a partial state update or a mutator function to the store.

In `'patch'` mode the adapter passes a plain partial object.
In `'replace'` mode the adapter passes a mutator callback that deletes
stale keys and assigns new ones.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `patch` | `Partial`\<`State`\> \| (`state`) => `void` | Either a `Partial<State>` object whose keys will be shallowly merged into the store, or a mutator function that receives the current state and may mutate it directly. |

#### Returns

`void`
