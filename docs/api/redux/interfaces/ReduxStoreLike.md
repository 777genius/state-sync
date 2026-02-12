[**@statesync/redux**](../index.md)

***

[@statesync/redux](../index.md) / ReduxStoreLike

# Interface: ReduxStoreLike\<State\>

Defined in: redux.ts:47

Minimal structural interface that a Redux store satisfies.

We intentionally avoid importing `redux` types here so this adapter stays
dependency-free and can be used in environments where the `redux` or
`@reduxjs/toolkit` package is not installed. Any object that structurally
matches this interface — including a real Redux `Store` — can be passed to
[createReduxSnapshotApplier](../functions/createReduxSnapshotApplier.md).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Redux store's state. |

## Methods

### dispatch()

```ts
dispatch(action): unknown;
```

Defined in: redux.ts:68

Dispatches an action. This is the only way to trigger a state change in
Redux.

The adapter dispatches a [SnapshotAppliedAction](SnapshotAppliedAction.md) containing the
mapped and filtered snapshot data.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | [`SnapshotAppliedAction`](SnapshotAppliedAction.md)\<`State`\> | The action to dispatch. |

#### Returns

`unknown`

The dispatched action.

***

### getState()

```ts
getState(): State;
```

Defined in: redux.ts:56

Returns the current state tree of the store.

Used by the adapter in `'replace'` mode to read existing state so that
keys excluded by `omitKeys` can be preserved.

#### Returns

`State`

The current state object.
