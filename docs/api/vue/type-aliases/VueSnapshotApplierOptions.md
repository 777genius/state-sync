[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueSnapshotApplierOptions

# Type Alias: VueSnapshotApplierOptions\<State, Data\>

```ts
type VueSnapshotApplierOptions<State, Data> = 
  | VueReactiveSnapshotApplierOptions<State, Data>
| VueRefSnapshotApplierOptions<State, Data>;
```

Defined in: [vue.ts:58](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/vue/src/vue.ts#L58)

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |
