[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueTargetKind

# Type Alias: VueTargetKind

```ts
type VueTargetKind = "ref" | "reactive";
```

Defined in: [vue.ts:37](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/vue/src/vue.ts#L37)

Discriminator for the Vue applier target.

- `'reactive'` -- targets a Vue `reactive()` proxy via in-place property mutation.
- `'ref'` -- targets a Vue `ref()` or `shallowRef()` container via `.value` replacement.
