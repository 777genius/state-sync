[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / createCrossTabSync

# Function: createCrossTabSync()

```ts
function createCrossTabSync<T>(options): CrossTabSync<T>;
```

Defined in: [persistence/src/cross-tab.ts:103](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L103)

Creates a cross-tab synchronization manager.

Uses BroadcastChannel API for real-time updates between tabs.
Falls back to no-op if BroadcastChannel is not supported.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CrossTabSyncHandlers`](../interfaces/CrossTabSyncHandlers.md)\<`T`\> |

## Returns

[`CrossTabSync`](../interfaces/CrossTabSync.md)\<`T`\>
