[**@statesync/valtio**](../index.md)

***

[@statesync/valtio](../index.md) / ValtioProxyLike

# Type Alias: ValtioProxyLike\<State\>

```ts
type ValtioProxyLike<State> = State;
```

Defined in: [valtio.ts:9](https://github.com/777genius/state-sync/blob/6c6e0d479cf192c3cfd1c8f1bfbceaf70a62ee5d/packages/valtio/src/valtio.ts#L9)

Valtio uses mutable proxies. The "store" is just the proxy object itself.

We intentionally avoid importing `valtio` types here so this adapter stays
dependency-free and can be used in environments where valtio is not installed.

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
