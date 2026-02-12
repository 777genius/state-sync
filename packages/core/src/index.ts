/**
 * @statesync/core -- Revision-based state synchronization primitives.
 *
 * This is the core package of the state-sync library. It provides a
 * transport-agnostic engine that keeps local state in sync with an
 * authoritative server using revision-based invalidation.
 *
 * ## Key concepts
 *
 * - **Topic** -- A string identifier that scopes a sync loop to a specific resource.
 * - **Revision** -- A canonical decimal u64 string used to totally order state versions.
 * - **Invalidation event** -- A lightweight notification telling the client that
 *   the server's revision has advanced (i.e. "your data is stale").
 * - **Snapshot** -- The full authoritative state fetched from the server, wrapped
 *   in a {@link SnapshotEnvelope} with its revision.
 *
 * ## Quick start
 *
 * ```ts
 * import {
 *   createRevisionSync,
 *   createConsoleLogger,
 * } from '@statesync/core';
 *
 * const handle = createRevisionSync({
 *   topic: 'user-profile',
 *   subscriber: myWebSocketSubscriber,
 *   provider: { getSnapshot: () => fetch('/api/snapshot').then(r => r.json()) },
 *   applier: { apply: ({ data }) => store.setState(data) },
 *   logger: createConsoleLogger({ debug: true }),
 * });
 *
 * await handle.start();
 * ```
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Engine -- the core sync loop
// ---------------------------------------------------------------------------
export {
  createRevisionSync,
  type RevisionSyncHandle,
  type RevisionSyncOptions,
} from './engine';

// ---------------------------------------------------------------------------
// Logger utilities
// ---------------------------------------------------------------------------
export { type ConsoleLoggerOptions, createConsoleLogger, noopLogger, tagLogger } from './logger';

// ---------------------------------------------------------------------------
// Retry utilities
// ---------------------------------------------------------------------------
export {
  type RetryPolicy,
  type RetryReportingOptions,
  withRetry,
  withRetryReporting,
} from './retry';

// ---------------------------------------------------------------------------
// Revision helpers
// ---------------------------------------------------------------------------
export {
  compareRevisions,
  isCanonicalRevision,
  ZERO_REVISION,
} from './revision';

// ---------------------------------------------------------------------------
// Throttle / debounce utilities
// ---------------------------------------------------------------------------
export {
  createThrottledHandler,
  type InvalidationThrottlingOptions,
  type ThrottledHandler,
} from './throttle';

// ---------------------------------------------------------------------------
// Protocol types and contracts
// ---------------------------------------------------------------------------
export * from './types';
