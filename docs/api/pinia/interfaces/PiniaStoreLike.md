[**@statesync/pinia**](../index.md)

***

[@statesync/pinia](../index.md) / PiniaStoreLike

# Interface: PiniaStoreLike\<State\>

Defined in: [pinia.ts:14](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/pinia/src/pinia.ts#L14)

Minimal structural interface a Pinia store satisfies.

We intentionally avoid importing `pinia` types here so this adapter stays
dependency-free (from Pinia) and can be used in environments where the adapter
code is not imported.

The real Pinia store implements:
- `$state`
- `$patch(partial | mutator)`

## Type Parameters

| Type Parameter |
| ------ |
| `State` *extends* `Record`\<`string`, `unknown`\> |

## Properties

### $id?

```ts
optional $id: string;
```

Defined in: [pinia.ts:18](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/pinia/src/pinia.ts#L18)

Optional store id (Pinia exposes `$id`). Useful only for debugging.

***

### $state

```ts
$state: State;
```

Defined in: [pinia.ts:19](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/pinia/src/pinia.ts#L19)

## Methods

### $patch()

```ts
$patch(patch): void;
```

Defined in: [pinia.ts:20](https://github.com/777genius/state-sync/blob/bb3d0421376fc001c246959375069b16c35e1e84/packages/pinia/src/pinia.ts#L20)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `patch` | `Partial`\<`State`\> \| (`state`) => `void` |

#### Returns

`void`
