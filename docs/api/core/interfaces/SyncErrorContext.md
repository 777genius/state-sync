[**@statesync/core**](../index.md)

***

[@statesync/core](../index.md) / SyncErrorContext

# Interface: SyncErrorContext

Defined in: [types.ts:273](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L273)

Structured error context passed to the [RevisionSyncOptions.onError](RevisionSyncOptions.md#onerror) callback.

Contains enough information for error handlers to log, alert, or build
dashboards around sync failures. All fields beyond `phase` and `error`
are optional and populated on a best-effort basis.

## Example

```ts
function handleSyncError(ctx: SyncErrorContext) {
  if (ctx.phase === 'getSnapshot' && ctx.willRetry) {
    console.warn(`Retry attempt ${ctx.attempt}, next in ${ctx.nextDelayMs}ms`);
  } else {
    reportToSentry(ctx.error, { phase: ctx.phase, topic: ctx.topic });
  }
}
```

## Properties

### attempt?

```ts
optional attempt: number;
```

Defined in: [types.ts:304](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L304)

The current retry attempt number (1-based).
Present when the error is reported by the retry wrapper.

***

### error

```ts
error: unknown;
```

Defined in: [types.ts:279](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L279)

The error value. May be an `Error` instance or any thrown value.

***

### eventRevision?

```ts
optional eventRevision: Revision;
```

Defined in: [types.ts:293](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L293)

The revision from the invalidation event that triggered the refresh, if applicable.

***

### localRevision?

```ts
optional localRevision: Revision;
```

Defined in: [types.ts:289](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L289)

The local revision at the time of the error.
Helpful for triage and metrics.

***

### nextDelayMs?

```ts
optional nextDelayMs: number;
```

Defined in: [types.ts:313](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L313)

The delay in milliseconds before the next retry attempt.
Present when [willRetry](#willretry) is `true`.

***

### phase

```ts
phase: SyncPhase;
```

Defined in: [types.ts:275](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L275)

The sync lifecycle phase where the error occurred.

***

### snapshotRevision?

```ts
optional snapshotRevision: Revision;
```

Defined in: [types.ts:297](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L297)

The revision from the snapshot that was being processed when the error occurred.

***

### sourceEvent?

```ts
optional sourceEvent: unknown;
```

Defined in: [types.ts:284](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L284)

Raw event payload when applicable (transport-specific).
Intentionally `unknown` to keep core transport-agnostic.

***

### sourceId?

```ts
optional sourceId: string;
```

Defined in: [types.ts:299](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L299)

The source identifier from the invalidation event, if available.

***

### topic?

```ts
optional topic: string;
```

Defined in: [types.ts:277](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L277)

The topic associated with this sync loop, if available.

***

### willRetry?

```ts
optional willRetry: boolean;
```

Defined in: [types.ts:308](https://github.com/777genius/state-sync/blob/434e90dae1bbdcb8d24f484b34449c31d0e7a883/packages/core/src/types.ts#L308)

Whether the engine or retry wrapper will attempt another try after this error.
