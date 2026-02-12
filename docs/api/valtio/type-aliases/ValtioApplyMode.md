[**@statesync/valtio**](../index.md)

***

[@statesync/valtio](../index.md) / ValtioApplyMode

# Type Alias: ValtioApplyMode

```ts
type ValtioApplyMode = "patch" | "replace";
```

Defined in: [valtio.ts:29](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/valtio/src/valtio.ts#L29)

The strategy used to apply incoming snapshot data to the Valtio proxy.

- `'patch'` — Iterates filtered keys and assigns them directly on the
  proxy (`proxy[key] = value`). Existing keys not present in the snapshot
  are left untouched. Valtio's reactivity tracks each property mutation.
- `'replace'` — First deletes allowed keys not present in the new state,
  then assigns keys from the new state. The proxy reference remains the
  same, so existing `useSnapshot()` / `subscribe()` consumers continue
  to work without re-wiring.
