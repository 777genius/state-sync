[**@statesync/zustand**](../index.md)

***

[@statesync/zustand](../index.md) / ZustandStoreLike

# Interface: ZustandStoreLike\<State\>

Defined in: [zustand.ts:18](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/zustand/src/zustand.ts#L18)

Minimal structural interface that a Zustand store satisfies.

We intentionally avoid importing `zustand` types here so this adapter stays
dependency-free (from Zustand) and can be used in environments where the
`zustand` package is not installed. Any object that structurally matches
this interface — including a real `StoreApi` — can be passed to
[createZustandSnapshotApplier](../functions/createZustandSnapshotApplier.md).

The real Zustand store implements at minimum:
- `getState()` — returns the current state snapshot
- `setState(partial, replace?)` — merges or replaces state

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> | The shape of the Zustand store's state object. |

## Methods

### getState()

```ts
getState(): State;
```

Defined in: [zustand.ts:27](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/zustand/src/zustand.ts#L27)

Returns the current state snapshot of the store.

Used by the adapter in `'replace'` mode to read the existing state so
that keys excluded by `omitKeys` can be preserved in the rebuilt object.

#### Returns

`State`

The current state object.

***

### setState()

```ts
setState(partial, replace?): void;
```

Defined in: [zustand.ts:41](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/zustand/src/zustand.ts#L41)

Updates the store's state.

In `'patch'` mode the adapter calls this with a `Partial<State>` to
perform a shallow merge. In `'replace'` mode the adapter calls this
with the full rebuilt state and `replace = true` for an atomic swap.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `partial` | \| `State` \| `Partial`\<`State`\> \| (`state`) => `State` \| `Partial`\<`State`\> | A full state, partial state, or updater function that produces a full or partial state from the current state. |
| `replace?` | `boolean` | When `true`, replaces the entire state instead of shallow-merging. Defaults to `false` in Zustand's implementation. |

#### Returns

`void`
