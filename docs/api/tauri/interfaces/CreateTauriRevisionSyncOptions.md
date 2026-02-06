[**@statesync/tauri**](../index.md)

***

[@statesync/tauri](../index.md) / CreateTauriRevisionSyncOptions

# Interface: CreateTauriRevisionSyncOptions\<T\>

Defined in: [sync.ts:15](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L15)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### applier

```ts
applier: SnapshotApplier<T>;
```

Defined in: [sync.ts:36](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L36)

***

### args?

```ts
optional args: Record<string, unknown>;
```

Defined in: [sync.ts:34](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L34)

Optional invoke args passed to the snapshot command.

***

### commandName

```ts
commandName: string;
```

Defined in: [sync.ts:29](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L29)

Tauri command name used to fetch a snapshot.

***

### eventName

```ts
eventName: string;
```

Defined in: [sync.ts:24](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L24)

Event name used for invalidation events.

***

### invoke

```ts
invoke: TauriInvoke;
```

Defined in: [sync.ts:19](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L19)

***

### listen

```ts
listen: TauriListen;
```

Defined in: [sync.ts:18](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L18)

***

### logger?

```ts
optional logger: Logger;
```

Defined in: [sync.ts:42](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L42)

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [sync.ts:43](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L43)

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

Defined in: [sync.ts:41](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L41)

Optional pass-through options to core.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `InvalidationEvent` |

#### Returns

`boolean`

***

### throttling?

```ts
optional throttling: InvalidationThrottlingOptions;
```

Defined in: [sync.ts:48](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L48)

Optional throttling configuration to control refresh rate.

***

### topic

```ts
topic: string;
```

Defined in: [sync.ts:16](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/tauri/src/sync.ts#L16)
