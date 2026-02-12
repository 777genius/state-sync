[**@statesync/redux**](../index.md)

***

[@statesync/redux](../index.md) / withSnapshotHandling

# Function: withSnapshotHandling()

```ts
function withSnapshotHandling<State, Action>(reducer): (state, action) => State;
```

Defined in: redux.ts:284

Higher-order function that wraps an existing reducer to automatically handle
[SNAPSHOT\_ACTION\_TYPE](../variables/SNAPSHOT_ACTION_TYPE.md) actions.

When the wrapped reducer receives a snapshot action:
- In `'patch'` mode: returns `{ ...state, ...payload }` (shallow merge).
- In `'replace'` mode: returns `payload as State` (full replacement).

All other actions are forwarded to the original reducer unchanged.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the reducer's state. |
| `Action` | The union of actions the original reducer handles. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `reducer` | (`state`, `action`) => `State` | The original reducer to wrap. |

## Returns

A new reducer that intercepts snapshot actions.

```ts
(state, action): State;
```

### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | `State` \| `undefined` |
| `action` | \| `Action` \| [`SnapshotAppliedAction`](../interfaces/SnapshotAppliedAction.md)\<`State`\> |

### Returns

`State`

## Example

```ts
import { configureStore } from '@reduxjs/toolkit';
import { withSnapshotHandling } from '@statesync/redux';

const store = configureStore({
  reducer: withSnapshotHandling(rootReducer),
});
```
