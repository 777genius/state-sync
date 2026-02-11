[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronWebContentsLike

# Interface: ElectronWebContentsLike

Defined in: [types.ts:45](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L45)

Structural type for webContents-like object.
Used by main-process broadcaster.

## Methods

### isDestroyed()

```ts
isDestroyed(): boolean;
```

Defined in: [types.ts:46](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L46)

#### Returns

`boolean`

***

### send()

```ts
send(channel, ...args): void;
```

Defined in: [types.ts:47](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L47)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| ...`args` | `unknown`[] |

#### Returns

`void`
