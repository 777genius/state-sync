[**state-sync**](../index.md)

***

[state-sync](../index.md) / Topic

# Type Alias: Topic

```ts
type Topic = string;
```

Defined in: [types.ts:18](https://github.com/777genius/state-sync/blob/d48d2fb1fe2fdd22693b17e1120600989add63ac/packages/core/src/types.ts#L18)

A stable identifier for a synchronized domain/resource.

v0 runtime rule (validated by the engine on input):
- MUST be a non-empty string after trim()
