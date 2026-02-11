[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistenceStats

# Interface: PersistenceStats

Defined in: [persistence/src/types.ts:261](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L261)

Persistence statistics.

## Properties

### lastSaveAt

```ts
lastSaveAt: number | null;
```

Defined in: [persistence/src/types.ts:280](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L280)

Last save timestamp.

***

### lastSaveDurationMs

```ts
lastSaveDurationMs: number | null;
```

Defined in: [persistence/src/types.ts:285](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L285)

Last save duration in ms.

***

### saveCount

```ts
saveCount: number;
```

Defined in: [persistence/src/types.ts:265](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L265)

Total number of saves.

***

### saveErrorCount

```ts
saveErrorCount: number;
```

Defined in: [persistence/src/types.ts:270](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L270)

Number of failed saves.

***

### throttledCount

```ts
throttledCount: number;
```

Defined in: [persistence/src/types.ts:290](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L290)

Number of saves skipped due to throttling.

***

### totalBytesSaved

```ts
totalBytesSaved: number;
```

Defined in: [persistence/src/types.ts:275](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L275)

Total bytes saved.
