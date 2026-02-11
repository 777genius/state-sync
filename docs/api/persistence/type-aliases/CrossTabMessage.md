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

Defined in: [persistence/src/cross-tab.ts:7](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/persistence/src/cross-tab.ts#L7)

Message types for cross-tab communication.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
