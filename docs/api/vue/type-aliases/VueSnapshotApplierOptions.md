[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueSnapshotApplierOptions

# Type Alias: VueSnapshotApplierOptions\<State, Data\>

```ts
type VueSnapshotApplierOptions<State, Data> = 
  | VueReactiveSnapshotApplierOptions<State, Data>
| VueRefSnapshotApplierOptions<State, Data>;
```

Defined in: [vue.ts:246](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/vue/src/vue.ts#L246)

Union of all Vue snapshot applier option shapes.

Discriminated by the `target` field:
- `'reactive'` (or omitted) -- [VueReactiveSnapshotApplierOptions](VueReactiveSnapshotApplierOptions.md)
- `'ref'` -- [VueRefSnapshotApplierOptions](VueRefSnapshotApplierOptions.md)

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Vue reactive object or ref value. Must be a plain object. |
| `Data` | The snapshot payload type received from the sync engine. |
