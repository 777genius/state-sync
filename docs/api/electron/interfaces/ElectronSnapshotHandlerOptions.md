[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronSnapshotHandlerOptions

# Interface: ElectronSnapshotHandlerOptions\<T\>

Defined in: [main.ts:73](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L73)

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### channel?

```ts
optional channel: string;
```

Defined in: [main.ts:83](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L83)

Override default channel

***

### getSnapshot()

```ts
getSnapshot: () => SnapshotEnvelope<T> | Promise<SnapshotEnvelope<T>>;
```

Defined in: [main.ts:79](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L79)

Returns the current snapshot. May be called concurrently from multiple renderers.
Must be safe for concurrent invocations — avoid side effects.

#### Returns

`SnapshotEnvelope`\<`T`\> \| `Promise`\<`SnapshotEnvelope`\<`T`\>\>

***

### handle

```ts
handle: ElectronIpcMainHandle;
```

Defined in: [main.ts:80](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L80)

***

### removeHandler

```ts
removeHandler: ElectronIpcMainRemoveHandler;
```

Defined in: [main.ts:81](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L81)

***

### topic

```ts
topic: string;
```

Defined in: [main.ts:74](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L74)
