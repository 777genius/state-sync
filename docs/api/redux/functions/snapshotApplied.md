[**@statesync/redux**](../index.md)

***

[@statesync/redux](../index.md) / snapshotApplied

# Function: snapshotApplied()

```ts
function snapshotApplied<State>(payload, meta): SnapshotAppliedAction<State>;
```

Defined in: redux.ts:237

Creates a [SnapshotAppliedAction](../interfaces/SnapshotAppliedAction.md) — the action dispatched by the
adapter when a snapshot is applied.

You can use this action creator together with RTK `extraReducers` to handle
snapshot application in specific slices without wrapping the root reducer
with [withSnapshotHandling](withSnapshotHandling.md).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` | The shape of the state that the snapshot applies to. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `payload` | `State` \| `Partial`\<`State`\> | The (already mapped and filtered) state data. |
| `meta` | \{ `mode`: [`ReduxApplyMode`](../type-aliases/ReduxApplyMode.md); `revision`: `string`; \} | Action metadata containing the apply mode and revision. |
| `meta.mode` | [`ReduxApplyMode`](../type-aliases/ReduxApplyMode.md) | - |
| `meta.revision` | `string` | - |

## Returns

[`SnapshotAppliedAction`](../interfaces/SnapshotAppliedAction.md)\<`State`\>

The action object to dispatch.

## Example

```ts
import { createSlice } from '@reduxjs/toolkit';
import { snapshotApplied } from '@statesync/redux';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], total: 0 },
  reducers: { ... },
  extraReducers: (builder) => {
    builder.addCase(snapshotApplied.type, (state, action) => {
      return { ...state, ...action.payload };
    });
  },
});
```
