[**@statesync/redux**](../index.md)

***

[@statesync/redux](../index.md) / SNAPSHOT\_ACTION\_TYPE

# Variable: SNAPSHOT\_ACTION\_TYPE

```ts
const SNAPSHOT_ACTION_TYPE: "@@statesync/SNAPSHOT_APPLIED";
```

Defined in: redux.ts:10

Action type constant dispatched by the adapter when applying a snapshot.

Reducers wrapped with [withSnapshotHandling](../functions/withSnapshotHandling.md) intercept this action
automatically. You can also handle it manually in RTK `extraReducers` or
a plain `switch` reducer.
