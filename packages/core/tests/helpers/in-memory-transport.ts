import type {
  InvalidationEvent,
  InvalidationSubscriber,
  SnapshotEnvelope,
  SnapshotProvider,
  Unsubscribe,
} from '../../src/types';

export class InMemoryTransport<T> implements InvalidationSubscriber, SnapshotProvider<T> {
  private handlers = new Set<(e: InvalidationEvent) => void>();
  private snapshot: SnapshotEnvelope<T> | null = null;
  private snapshotDelayMs = 0;

  get subscriberCount(): number {
    return this.handlers.size;
  }

  setSnapshot(envelope: SnapshotEnvelope<T>): void {
    this.snapshot = envelope;
  }

  setSnapshotDelay(ms: number): void {
    this.snapshotDelayMs = ms;
  }

  emit(event: InvalidationEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  async subscribe(handler: (e: InvalidationEvent) => void): Promise<Unsubscribe> {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  async getSnapshot(): Promise<SnapshotEnvelope<T>> {
    if (!this.snapshot) {
      throw new Error('No snapshot configured');
    }
    if (this.snapshotDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.snapshotDelayMs));
    }
    return this.snapshot;
  }
}
