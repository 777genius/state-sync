[**@statesync/valtio**](../index.md)

***

[@statesync/valtio](../index.md) / ValtioProxyLike

# Type Alias: ValtioProxyLike\<State\>

```ts
type ValtioProxyLike<State> = State;
```

Defined in: [valtio.ts:16](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/valtio/src/valtio.ts#L16)

Structural type alias representing a Valtio proxy object.

In Valtio, the "store" is simply a mutable proxy created with
`proxy({ ... })`. Unlike Pinia or Zustand there is no wrapper API — the
proxy **is** the state object. This type alias makes that semantic explicit
while keeping the adapter dependency-free from the `valtio` package.

Any plain object whose shape matches `State` can be used, including a real
Valtio proxy returned by `proxy()`.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the proxy's state object. |
