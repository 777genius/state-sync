[**@statesync/zustand**](../index.md)

***

[@statesync/zustand](../index.md) / ZustandApplyMode

# Type Alias: ZustandApplyMode

```ts
type ZustandApplyMode = "patch" | "replace";
```

Defined in: [zustand.ts:56](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/zustand/src/zustand.ts#L56)

The strategy used to apply incoming snapshot data to the Zustand store.

- `'patch'` — Non-destructive shallow merge via `store.setState(partial)`.
  Existing keys not present in the snapshot are left untouched.
- `'replace'` — Atomic state swap via `store.setState(nextState, true)`.
  The entire state is replaced; keys excluded by `omitKeys` are preserved
  by being merged back into the rebuilt object before the swap.
