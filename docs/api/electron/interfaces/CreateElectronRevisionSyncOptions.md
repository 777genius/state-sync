[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / CreateElectronRevisionSyncOptions

# Interface: CreateElectronRevisionSyncOptions\<T\>

Defined in: [sync.ts:12](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L12)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### applier

```ts
applier: SnapshotApplier<T>;
```

Defined in: [sync.ts:16](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L16)

***

### bridge

```ts
bridge: ElectronStateSyncBridge;
```

Defined in: [sync.ts:15](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L15)

The bridge object from window.statesync

***

### invalidationChannel?

```ts
optional invalidationChannel: string;
```

Defined in: [sync.ts:19](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L19)

Override default channel: statesync:${topic}:invalidated

***

### logger?

```ts
optional logger: Logger;
```

Defined in: [sync.ts:24](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L24)

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [sync.ts:25](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L25)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | `SyncErrorContext` |

#### Returns

`void`

***

### shouldRefresh()?

```ts
optional shouldRefresh: (event) => boolean;
```

Defined in: [sync.ts:23](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L23)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `InvalidationEvent` |

#### Returns

`boolean`

***

### snapshotChannel?

```ts
optional snapshotChannel: string;
```

Defined in: [sync.ts:21](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L21)

Override default channel: statesync:${topic}:snapshot

***

### throttling?

```ts
optional throttling: InvalidationThrottlingOptions;
```

Defined in: [sync.ts:26](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L26)

***

### topic

```ts
topic: string;
```

Defined in: [sync.ts:13](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/sync.ts#L13)
