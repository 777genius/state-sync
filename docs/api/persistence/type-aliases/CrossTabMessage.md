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

Defined in: [persistence/src/cross-tab.ts:7](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/cross-tab.ts#L7)

Message types for cross-tab communication.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
