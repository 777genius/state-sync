[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MigrationResult

# Interface: MigrationResult\<T\>

Defined in: [persistence/src/types.ts:206](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L206)

Result of migration attempt.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### data?

```ts
optional data: T;
```

Defined in: [persistence/src/types.ts:208](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L208)

***

### error?

```ts
optional error: Error;
```

Defined in: [persistence/src/types.ts:211](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L211)

***

### fromVersion

```ts
fromVersion: number;
```

Defined in: [persistence/src/types.ts:209](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L209)

***

### success

```ts
success: boolean;
```

Defined in: [persistence/src/types.ts:207](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L207)

***

### toVersion

```ts
toVersion: number;
```

Defined in: [persistence/src/types.ts:210](https://github.com/777genius/state-sync/blob/ff3d517babcdb0d1d56ebc13662dd57a37825036/packages/persistence/src/types.ts#L210)
