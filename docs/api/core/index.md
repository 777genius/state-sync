**@statesync/core**

***

# @statesync/core

@statesync/core -- Revision-based state synchronization primitives.

This is the core package of the state-sync library. It provides a
transport-agnostic engine that keeps local state in sync with an
authoritative server using revision-based invalidation.

## Key concepts

- **Topic** -- A string identifier that scopes a sync loop to a specific resource.
- **Revision** -- A canonical decimal u64 string used to totally order state versions.
- **Invalidation event** -- A lightweight notification telling the client that
  the server's revision has advanced (i.e. "your data is stale").
- **Snapshot** -- The full authoritative state fetched from the server, wrapped
  in a [SnapshotEnvelope](interfaces/SnapshotEnvelope.md) with its revision.

## Quick start

```ts
import {
  createRevisionSync,
  createConsoleLogger,
} from '@statesync/core';

const handle = createRevisionSync({
  topic: 'user-profile',
  subscriber: myWebSocketSubscriber,
  provider: { getSnapshot: () => fetch('/api/snapshot').then(r => r.json()) },
  applier: { apply: ({ data }) => store.setState(data) },
  logger: createConsoleLogger({ debug: true }),
});

await handle.start();
```

## Interfaces

- [ConsoleLoggerOptions](interfaces/ConsoleLoggerOptions.md)
- [InvalidationEvent](interfaces/InvalidationEvent.md)
- [InvalidationSubscriber](interfaces/InvalidationSubscriber.md)
- [InvalidationThrottlingOptions](interfaces/InvalidationThrottlingOptions.md)
- [Logger](interfaces/Logger.md)
- [RetryPolicy](interfaces/RetryPolicy.md)
- [RetryReportingOptions](interfaces/RetryReportingOptions.md)
- [RevisionSyncHandle](interfaces/RevisionSyncHandle.md)
- [RevisionSyncOptions](interfaces/RevisionSyncOptions.md)
- [SnapshotApplier](interfaces/SnapshotApplier.md)
- [SnapshotEnvelope](interfaces/SnapshotEnvelope.md)
- [SnapshotProvider](interfaces/SnapshotProvider.md)
- [SyncErrorContext](interfaces/SyncErrorContext.md)
- [ThrottledHandler](interfaces/ThrottledHandler.md)

## Type Aliases

- [Revision](type-aliases/Revision.md)
- [SyncPhase](type-aliases/SyncPhase.md)
- [Topic](type-aliases/Topic.md)
- [Unsubscribe](type-aliases/Unsubscribe.md)

## Variables

- [noopLogger](variables/noopLogger.md)
- [ZERO\_REVISION](variables/ZERO_REVISION.md)

## Functions

- [compareRevisions](functions/compareRevisions.md)
- [createConsoleLogger](functions/createConsoleLogger.md)
- [createRevisionSync](functions/createRevisionSync.md)
- [createThrottledHandler](functions/createThrottledHandler.md)
- [isCanonicalRevision](functions/isCanonicalRevision.md)
- [tagLogger](functions/tagLogger.md)
- [withRetry](functions/withRetry.md)
- [withRetryReporting](functions/withRetryReporting.md)
