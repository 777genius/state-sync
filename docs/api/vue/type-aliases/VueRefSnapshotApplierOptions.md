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

Defined in: vue.ts:40

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |
| `Data` |
