[**@statesync/zustand**](../index.md)

***

[@statesync/zustand](../index.md) / ZustandStoreLike

# Interface: ZustandStoreLike\<State\>

Defined in: [zustand.ts:14](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/zustand/src/zustand.ts#L14)

Minimal structural interface a Zustand store satisfies.

We intentionally avoid importing `zustand` types here so this adapter stays
dependency-free (from Zustand) and can be used in environments where the adapter
code is not imported.

The real Zustand store implements:
- `getState()`
- `setState(partial, replace?)`

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |

## Methods

### getState()

```ts
getState(): State;
```

Defined in: [zustand.ts:15](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/zustand/src/zustand.ts#L15)

#### Returns

`State`

***

### setState()

```ts
setState(partial, replace?): void;
```

Defined in: [zustand.ts:16](https://github.com/777genius/state-sync/blob/668de7da1d4d3890666def53daaca924c668db8f/packages/zustand/src/zustand.ts#L16)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `partial` | \| `State` \| `Partial`\<`State`\> \| (`state`) => `State` \| `Partial`\<`State`\> |
| `replace?` | `boolean` |

#### Returns

`void`
