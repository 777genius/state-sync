[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / StorageUsage

# Interface: StorageUsage

Defined in: [persistence/src/types.ts:131](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L131)

Storage usage information.

## Properties

### percentage?

```ts
optional percentage: number;
```

Defined in: [persistence/src/types.ts:145](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L145)

Usage percentage (0-100).

***

### quota?

```ts
optional quota: number;
```

Defined in: [persistence/src/types.ts:140](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L140)

Available quota in bytes (if known).

***

### used

```ts
used: number;
```

Defined in: [persistence/src/types.ts:135](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L135)

Used space in bytes.
