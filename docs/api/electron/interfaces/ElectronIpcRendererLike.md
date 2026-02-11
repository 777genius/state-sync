[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronIpcRendererLike

# Interface: ElectronIpcRendererLike

Defined in: [types.ts:10](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L10)

Structural type for ipcRenderer-like object.
Used by createElectronBridge in preload.

## Methods

### invoke()

```ts
invoke(channel, ...args): Promise<unknown>;
```

Defined in: [types.ts:13](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L13)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| ...`args` | `unknown`[] |

#### Returns

`Promise`\<`unknown`\>

***

### on()

```ts
on(channel, listener): unknown;
```

Defined in: [types.ts:11](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L11)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| `listener` | (`event`, ...`args`) => `void` |

#### Returns

`unknown`

***

### removeListener()

```ts
removeListener(channel, listener): unknown;
```

Defined in: [types.ts:12](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/types.ts#L12)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `channel` | `string` |
| `listener` | (`event`, ...`args`) => `void` |

#### Returns

`unknown`
