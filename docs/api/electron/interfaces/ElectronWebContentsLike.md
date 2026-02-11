[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronWebContentsLike

# Interface: ElectronWebContentsLike

Defined in: types.ts:45

Structural type for webContents-like object.
Used by main-process broadcaster.

## Methods

### isDestroyed()

```ts
isDestroyed(): boolean;
```

Defined in: types.ts:46

#### Returns

`boolean`

***

### send()

```ts
send(channel, ...args): void;
```

Defined in: types.ts:47

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| ...`args` | `unknown`[] |

#### Returns

`void`
