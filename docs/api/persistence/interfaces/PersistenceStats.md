[**@statesync/persistence**](../index.md)

***

[@statesync/persistence](../index.md) / PersistenceStats

# Interface: PersistenceStats

Defined in: [persistence/src/types.ts:489](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L489)

Cumulative statistics about persistence operations.

Retrieved via [DisposablePersistenceApplier.getStats](DisposablePersistenceApplier.md#getstats). Useful for
monitoring, logging, and performance tuning of throttle/debounce settings.

## Properties

### lastSaveAt

```ts
lastSaveAt: number | null;
```

Defined in: [persistence/src/types.ts:509](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L509)

Timestamp of the most recent successful save (ms since epoch),
or `null` if no save has completed yet.

***

### lastSaveDurationMs

```ts
lastSaveDurationMs: number | null;
```

Defined in: [persistence/src/types.ts:515](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L515)

Duration of the most recent successful save in milliseconds,
or `null` if no save has completed yet.

***

### saveCount

```ts
saveCount: number;
```

Defined in: [persistence/src/types.ts:493](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L493)

Total number of successful save operations since the applier was created.

***

### saveErrorCount

```ts
saveErrorCount: number;
```

Defined in: [persistence/src/types.ts:498](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L498)

Total number of save operations that failed (threw an error).

***

### throttledCount

```ts
throttledCount: number;
```

Defined in: [persistence/src/types.ts:521](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L521)

Number of save invocations that were skipped because the throttle/debounce
handler determined a save was already scheduled or too recent.

***

### totalBytesSaved

```ts
totalBytesSaved: number;
```

Defined in: [persistence/src/types.ts:503](https://github.com/777genius/state-sync/blob/60c6b1086208eaa00c3e8cf44dc6622824c902a9/packages/persistence/src/types.ts#L503)

Cumulative size in bytes of all data saved (measured before compression).
