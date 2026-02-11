[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronSnapshotHandlerOptions

# Interface: ElectronSnapshotHandlerOptions\<T\>

Defined in: main.ts:66

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### channel?

```ts
optional channel: string;
```

Defined in: main.ts:72

Override default channel

***

### getSnapshot()

```ts
getSnapshot: () => SnapshotEnvelope<T> | Promise<SnapshotEnvelope<T>>;
```

Defined in: main.ts:68

#### Returns

`SnapshotEnvelope`\<`T`\> \| `Promise`\<`SnapshotEnvelope`\<`T`\>\>

***

### handle

```ts
handle: ElectronIpcMainHandle;
```

Defined in: main.ts:69

***

### removeHandler

```ts
removeHandler: ElectronIpcMainRemoveHandler;
```

Defined in: main.ts:70

***

### topic

```ts
topic: string;
```

Defined in: main.ts:67
