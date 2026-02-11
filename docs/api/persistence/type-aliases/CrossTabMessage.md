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

Defined in: [persistence/src/cross-tab.ts:7](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/persistence/src/cross-tab.ts#L7)

Message types for cross-tab communication.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
