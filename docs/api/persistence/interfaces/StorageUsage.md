[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / StorageUsage

# Interface: StorageUsage

Defined in: [persistence/src/types.ts:236](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L236)

Storage usage information reported by a backend.

Provides insight into how much storage is consumed and what the browser quota is,
useful for monitoring and alerting before quota is exceeded.

## Properties

### percentage?

```ts
optional percentage: number;
```

Defined in: [persistence/src/types.ts:254](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L254)

Usage as a percentage (0--100), calculated as `(used / quota) * 100`.

Only present when [quota](#quota) is known.

***

### quota?

```ts
optional quota: number;
```

Defined in: [persistence/src/types.ts:247](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L247)

Total storage quota in bytes, if the browser reports it.

May be `undefined` if the backend or environment does not expose quota information.

***

### used

```ts
used: number;
```

Defined in: [persistence/src/types.ts:240](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/persistence/src/types.ts#L240)

Number of bytes currently used by this backend's stored data.
