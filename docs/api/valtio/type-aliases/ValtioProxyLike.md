[**@statesync/valtio**](../index.md)

***

[@statesync/valtio](../index.md) / ValtioProxyLike

# Type Alias: ValtioProxyLike\<State\>

```ts
type ValtioProxyLike<State> = State;
```

Defined in: valtio.ts:9

Valtio uses mutable proxies. The "store" is just the proxy object itself.

We intentionally avoid importing `valtio` types here so this adapter stays
dependency-free and can be used in environments where valtio is not installed.

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
