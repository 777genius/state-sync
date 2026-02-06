[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueRefSnapshotApplierOptions

# Type Alias: VueRefSnapshotApplierOptions\<State, Data\>

```ts
type VueRefSnapshotApplierOptions<State, Data> = 
  | {
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "ref";
  toState?: (data, ctx) => Partial<State>;
}
  | {
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target: "ref";
  toState?: (data, ctx) => State;
};
```

Defined in: [vue.ts:40](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/vue/src/vue.ts#L40)

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |
