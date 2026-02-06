[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / MigrationHandler

# Interface: MigrationHandler\<T\>

Defined in: [persistence/src/types.ts:184](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L184)

Migration handler for schema versioning.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Properties

### currentVersion

```ts
currentVersion: number;
```

Defined in: [persistence/src/types.ts:188](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L188)

Current schema version.

***

### migrations

```ts
migrations: Record<number, MigrationFn<any, unknown>>;
```

Defined in: [persistence/src/types.ts:195](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L195)

Migration functions keyed by source version.
Example: { 1: (v1Data) => v2Data, 2: (v2Data) => v3Data }

***

### validate()?

```ts
optional validate: (data) => data is T;
```

Defined in: [persistence/src/types.ts:200](https://github.com/777genius/state-sync/blob/48102438d6533c027adaec4c679c6d12555df57e/packages/persistence/src/types.ts#L200)

Optional validator for migrated data.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `unknown` |

#### Returns

`data is T`
