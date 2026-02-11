[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistenceErrorContext

# Interface: PersistenceErrorContext

Defined in: [persistence/src/types.ts:300](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L300)

Context provided to error handlers.

## Properties

### error

```ts
error: unknown;
```

Defined in: [persistence/src/types.ts:302](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L302)

***

### metadata?

```ts
optional metadata: PersistedSnapshotMetadata;
```

Defined in: [persistence/src/types.ts:304](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L304)

***

### operation

```ts
operation: "load" | "clear" | "save" | "migrate";
```

Defined in: [persistence/src/types.ts:301](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L301)

***

### snapshot?

```ts
optional snapshot: SnapshotEnvelope<unknown>;
```

Defined in: [persistence/src/types.ts:303](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L303)
