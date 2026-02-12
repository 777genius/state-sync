[**@statesync/vue**](../index.md)

***

[@statesync/vue](../index.md) / VueTargetKind

# Type Alias: VueTargetKind

```ts
type VueTargetKind = "ref" | "reactive";
```

Defined in: [vue.ts:37](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/vue/src/vue.ts#L37)

Discriminator for the Vue applier target.

- `'reactive'` -- targets a Vue `reactive()` proxy via in-place property mutation.
- `'ref'` -- targets a Vue `ref()` or `shallowRef()` container via `.value` replacement.
