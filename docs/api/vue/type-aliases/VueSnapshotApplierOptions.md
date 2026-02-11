[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueSnapshotApplierOptions

# Type Alias: VueSnapshotApplierOptions\<State, Data\>

```ts
type VueSnapshotApplierOptions<State, Data> = 
  | VueReactiveSnapshotApplierOptions<State, Data>
| VueRefSnapshotApplierOptions<State, Data>;
```

Defined in: [vue.ts:58](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/vue/src/vue.ts#L58)

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |
