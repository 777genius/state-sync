[**state-sync-tauri**](../index.md)

***

[state-sync-tauri](../index.md) / CreateTauriRevisionSyncOptions

# Interface: CreateTauriRevisionSyncOptions\<T\>

Defined in: [sync.ts:11](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L11)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### applier

```ts
applier: SnapshotApplier<T>;
```

Defined in: [sync.ts:32](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L32)

***

### args?

```ts
optional args: Record<string, unknown>;
```

Defined in: [sync.ts:30](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L30)

Optional invoke args passed to the snapshot command.

***

### commandName

```ts
commandName: string;
```

Defined in: [sync.ts:25](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L25)

Tauri command name used to fetch a snapshot.

***

### eventName

```ts
eventName: string;
```

Defined in: [sync.ts:20](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L20)

Event name used for invalidation events.

***

### invoke

```ts
invoke: TauriInvoke;
```

Defined in: [sync.ts:15](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L15)

***

### listen

```ts
listen: TauriListen;
```

Defined in: [sync.ts:14](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L14)

***

### logger?

```ts
optional logger: Logger;
```

Defined in: [sync.ts:38](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L38)

***

### onError()?

```ts
optional onError: (ctx) => void;
```

Defined in: [sync.ts:39](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L39)

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

Defined in: [sync.ts:37](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L37)

Optional pass-through options to core.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `InvalidationEvent` |

#### Returns

`boolean`

***

### topic

```ts
topic: string;
```

Defined in: [sync.ts:12](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/tauri/src/sync.ts#L12)
