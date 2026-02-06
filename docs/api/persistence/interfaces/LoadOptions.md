[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / LoadOptions

# Interface: LoadOptions\<T\>

Defined in: [persistence/src/types.ts:432](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L432)

Options for loading persisted snapshots.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### ignoreTTL?

```ts
optional ignoreTTL: boolean;
```

Defined in: [persistence/src/types.ts:453](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L453)

If true, ignore TTL expiration.
Default: false

***

### migration?

```ts
optional migration: MigrationHandler<T>;
```

Defined in: [persistence/src/types.ts:436](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L436)

Migration handler for schema versioning.

***

### validate?

```ts
optional validate: boolean;
```

Defined in: [persistence/src/types.ts:442](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L442)

If true, validate data against schema.
Default: false

***

### validator()?

```ts
optional validator: (data) => data is T;
```

Defined in: [persistence/src/types.ts:447](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L447)

Custom validator function.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |

#### Returns

`data is T`

***

### verifyHash?

```ts
optional verifyHash: boolean;
```

Defined in: [persistence/src/types.ts:459](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L459)

If true, verify integrity hash.
Default: false
