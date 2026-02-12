[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / Topic

# Type Alias: Topic

```ts
type Topic = string;
```

Defined in: [types.ts:28](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/core/src/types.ts#L28)

A stable identifier for a synchronized domain or resource.

Topics are used to scope invalidation events and snapshots so that
multiple independent sync loops can coexist without interfering.

v0 runtime rule (validated by the engine on input):
- MUST be a non-empty string after `trim()`

## Example

```ts
const topic: Topic = 'user-profile';
```
