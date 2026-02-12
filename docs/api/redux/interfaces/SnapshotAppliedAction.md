[**@statesync/redux**](../index.md)

***

[@statesync/redux](../index.md) / SnapshotAppliedAction

# Interface: SnapshotAppliedAction\<State\>

Defined in: redux.ts:27

Shape of the action dispatched by [createReduxSnapshotApplier](../functions/createReduxSnapshotApplier.md).

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `State` | The shape of the Redux store's state. |

## Properties

### meta

```ts
meta: object;
```

Defined in: redux.ts:30

#### mode

```ts
mode: ReduxApplyMode;
```

#### revision

```ts
revision: string;
```

***

### payload

```ts
payload: State | Partial<State>;
```

Defined in: redux.ts:29

***

### type

```ts
type: "@@statesync/SNAPSHOT_APPLIED";
```

Defined in: redux.ts:28
