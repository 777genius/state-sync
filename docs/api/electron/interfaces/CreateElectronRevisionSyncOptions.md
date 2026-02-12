[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / CreateElectronRevisionSyncOptions

# Interface: CreateElectronRevisionSyncOptions\<T\>

Defined in: [sync.ts:28](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L28)

Configuration options for [createElectronRevisionSync](../functions/createElectronRevisionSync.md).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The application-specific snapshot data type. |

## Properties

### applier

```ts
applier: SnapshotApplier<T>;
```

Defined in: [sync.ts:45](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L45)

Callback invoked to apply a new snapshot to the application state.

#### See

SnapshotApplier from `@statesync/core`.

***

### bridge

```ts
bridge: ElectronStateSyncBridge;
```

Defined in: [sync.ts:38](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L38)

The bridge object exposed via `contextBridge.exposeInMainWorld()` in the preload script.

Typically accessed as `(window as any).statesync` in the renderer.
Created by [createElectronBridge](../functions/createElectronBridge.md).

***

### invalidationChannel?

```ts
optional invalidationChannel: string;
```

Defined in: [sync.ts:52](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L52)

Override the default IPC channel for invalidation events.

Defaults to `statesync:<topic>:invalidated`.

***

### logger?

```ts
optional logger: Logger;
```

Defined in: [sync.ts:75](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L75)

Optional logger for debug, warn, and error messages.

#### See

RevisionSyncOptions.logger

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [sync.ts:82](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L82)

Optional error callback invoked when any phase of the sync loop fails.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | `SyncErrorContext` |

#### Returns

`void`

#### See

RevisionSyncOptions.onError

***

### shouldRefresh()?

```ts
optional shouldRefresh: (event) => boolean;
```

Defined in: [sync.ts:68](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L68)

Optional predicate to filter invalidation events before triggering a refresh.

If provided, only events for which this returns `true` will cause a snapshot fetch.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `InvalidationEvent` |

#### Returns

`boolean`

#### See

RevisionSyncOptions.shouldRefresh

***

### snapshotChannel?

```ts
optional snapshotChannel: string;
```

Defined in: [sync.ts:59](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L59)

Override the default IPC channel for snapshot requests.

Defaults to `statesync:<topic>:snapshot`.

***

### throttling?

```ts
optional throttling: InvalidationThrottlingOptions;
```

Defined in: [sync.ts:90](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L90)

Optional throttling/debouncing configuration to control how frequently
invalidation events trigger snapshot refreshes.

#### See

InvalidationThrottlingOptions from `@statesync/core`.

***

### topic

```ts
topic: string;
```

Defined in: [sync.ts:30](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/electron/src/sync.ts#L30)

The sync topic identifier (e.g. `"user-profile"`). Must be a non-empty string.
