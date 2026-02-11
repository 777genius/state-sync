[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueRefLike

# Interface: VueRefLike\<State\>

Defined in: [vue.ts:9](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/vue/src/vue.ts#L9)

Minimal structural interface for a Vue ref-like container.

Compatible with `Ref<T>`, `ShallowRef<T>`, or any object with a `.value`
property of type `State`.

## Type Parameters

| Type Parameter |
| ------ |
| `State` |

## Properties

### value

```ts
value: State;
```

Defined in: [vue.ts:10](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/vue/src/vue.ts#L10)
