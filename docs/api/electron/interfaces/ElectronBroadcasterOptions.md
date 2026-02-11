[**@statesync/electron**](../index.md)

***

[@statesync/electron](../index.md) / ElectronBroadcasterOptions

# Interface: ElectronBroadcasterOptions

Defined in: main.ts:14

## Properties

### channel?

```ts
optional channel: string;
```

Defined in: main.ts:19

Override default channel

***

### getTargets()

```ts
getTargets: () => ElectronWebContentsLike[];
```

Defined in: main.ts:17

Returns webContents to broadcast to. Called on every invalidation.

#### Returns

[`ElectronWebContentsLike`](ElectronWebContentsLike.md)[]

***

### topic

```ts
topic: string;
```

Defined in: main.ts:15
