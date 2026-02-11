[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronBroadcasterOptions

# Interface: ElectronBroadcasterOptions

Defined in: [main.ts:14](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L14)

## Properties

### channel?

```ts
optional channel: string;
```

Defined in: [main.ts:22](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L22)

Override default channel

***

### getTargets()

```ts
getTargets: () => ElectronWebContentsLike[];
```

Defined in: [main.ts:20](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L20)

Returns webContents to broadcast to. Called on every invalidation.
The returned array is copied before iteration, so it's safe to return a live reference.

#### Returns

[`ElectronWebContentsLike`](ElectronWebContentsLike.md)[]

***

### topic

```ts
topic: string;
```

Defined in: [main.ts:15](https://github.com/777genius/state-sync/blob/e93ac0627da2558efb78e4efceaa287e9a61c5b8/packages/electron/src/main.ts#L15)
