[**@statesync/pinia**](../index.md)

***

[@statesync/pinia](../index.md) / PiniaApplyMode

# Type Alias: PiniaApplyMode

```ts
type PiniaApplyMode = "patch" | "replace";
```

Defined in: [pinia.ts:57](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/pinia/src/pinia.ts#L57)

The strategy used to apply incoming snapshot data to the Pinia store.

- `'patch'` — Non-destructive shallow merge via `store.$patch(partial)`.
  Existing keys not present in the snapshot are left untouched.
- `'replace'` — Full top-level replacement via a `$patch` mutator callback.
  Keys present in the store but absent from the snapshot are deleted.
