[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronBroadcasterHandle

# Interface: ElectronBroadcasterHandle

Defined in: [main.ts:25](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/main.ts#L25)

## Properties

### topic

```ts
readonly topic: string;
```

Defined in: [main.ts:26](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/main.ts#L26)

## Methods

### invalidate()

```ts
invalidate(revision, extra?): void;
```

Defined in: [main.ts:27](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/electron/src/main.ts#L27)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `revision` | `string` |
| `extra?` | \{ `sourceId?`: `string`; \} |
| `extra.sourceId?` | `string` |

#### Returns

`void`
