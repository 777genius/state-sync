/**
 * state-sync (core)
 *
 * Protocol primitives and contracts.
 *
 * v0 principles:
 * - event = invalidation
 * - snapshot = source of truth
 * - revision = canonical decimal u64 string (JSON/IPC friendly)
 */

/**
 * A stable identifier for a synchronized domain/resource.
 *
 * v0 runtime rule (validated by the engine on input):
 * - MUST be a non-empty string after trim()
 */
export type Topic = string;

/**
 * Canonical decimal u64 string.
 *
 * v0 canonicalization rules:
 * - must match `^[0-9]+$`
 * - "0" is allowed
 * - otherwise: no leading zeros
 *
 * NOTE: This type is intentionally a branded string to prevent accidental mixing
 * with other strings in user code. The engine is responsible for validation.
 */
export type Revision = string & { readonly __brand: 'Revision' };

export interface InvalidationEvent {
  topic: Topic;
  revision: Revision;
  sourceId?: string;
  timestampMs?: number;
}

export interface SnapshotEnvelope<T> {
  revision: Revision;
  data: T;
}

export type Unsubscribe = () => void;

export interface InvalidationSubscriber {
  subscribe(handler: (e: InvalidationEvent) => void): Promise<Unsubscribe>;
}

export interface SnapshotProvider<T> {
  getSnapshot(): Promise<SnapshotEnvelope<T>>;
}

export interface SnapshotApplier<T> {
  apply(snapshot: SnapshotEnvelope<T>): void | Promise<void>;
}

export interface Logger {
  debug(msg: string, extra?: unknown): void;
  warn(msg: string, extra?: unknown): void;
  error(msg: string, extra?: unknown): void;
}

export type SyncPhase =
  | 'start'
  | 'subscribe'
  | 'invalidation'
  | 'refresh'
  | 'getSnapshot'
  | 'apply'
  | 'protocol'
  | 'throttle';

export interface SyncErrorContext {
  phase: SyncPhase;
  topic?: Topic;
  error: unknown;
  /**
   * Raw event payload when applicable (transport-specific).
   * Intentionally `unknown` to keep core transport-agnostic.
   */
  sourceEvent?: unknown;
  /**
   * Helpful context for triage/metrics. These fields are optional and best-effort.
   */
  localRevision?: Revision;
  eventRevision?: Revision;
  snapshotRevision?: Revision;
  sourceId?: string;
  attempt?: number;
  willRetry?: boolean;
  nextDelayMs?: number;
}
