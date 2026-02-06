[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueReactiveSnapshotApplierOptions

# Type Alias: VueReactiveSnapshotApplierOptions\<State, Data\>

```ts
type VueReactiveSnapshotApplierOptions<State, Data> = 
  | {
  mode?: "patch";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "reactive";
  toState?: (data, ctx) => Partial<State>;
}
  | {
  mode: "replace";
  omitKeys?: ReadonlyArray<keyof State>;
  pickKeys?: ReadonlyArray<keyof State>;
  strict?: boolean;
  target?: "reactive";
  toState?: (data, ctx) => State;
};
```

Defined in: [vue.ts:22](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/vue/src/vue.ts#L22)

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |
