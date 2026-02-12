[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / CrossTabMessage

# Type Alias: CrossTabMessage\<T\>

```ts
type CrossTabMessage<T> = 
  | {
  payload: SnapshotEnvelope<T>;
  tabId: string;
  type: "snapshot";
}
  | {
  tabId: string;
  type: "request-sync";
}
  | {
  tabId: string;
  type: "clear";
};
```

Defined in: [persistence/src/cross-tab.ts:12](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/cross-tab.ts#L12)

Discriminated union of messages exchanged between tabs via BroadcastChannel.

Each variant carries a `type` discriminator, a `tabId` identifying the sender,
and (for `'snapshot'`) the actual state payload.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The shape of the application state. |

## Type Declaration

```ts
{
  payload: SnapshotEnvelope<T>;
  tabId: string;
  type: "snapshot";
}
```

### payload

```ts
payload: SnapshotEnvelope<T>;
```

The snapshot envelope being broadcast.

### tabId

```ts
tabId: string;
```

Unique identifier of the sending tab.

### type

```ts
type: "snapshot";
```

Indicates this message carries a full snapshot.

```ts
{
  tabId: string;
  type: "request-sync";
}
```

### tabId

```ts
tabId: string;
```

Unique identifier of the sending tab.

### type

```ts
type: "request-sync";
```

Indicates the sender is requesting the latest state from peers.

```ts
{
  tabId: string;
  type: "clear";
}
```

### tabId

```ts
tabId: string;
```

Unique identifier of the sending tab.

### type

```ts
type: "clear";
```

Indicates the sender has cleared its persisted storage.
