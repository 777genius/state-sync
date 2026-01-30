import { describe, expect, it, vi } from 'vitest';
import { createConsoleLogger, tagLogger, withRetry, withRetryReporting } from '../src';
import type { Revision, SnapshotEnvelope, SnapshotProvider } from '../src/types';

const r = (v: string) => v as Revision;

function makeProvider<T>(
  results: Array<SnapshotEnvelope<T> | Error>,
): SnapshotProvider<T> & { callCount: number } {
  let idx = 0;
  return {
    callCount: 0,
    async getSnapshot() {
      this.callCount++;
      const result = results[idx++];
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

describe('withRetry', () => {
  it('returns snapshot on first success', async () => {
    const provider = makeProvider([{ revision: r('1'), data: 'ok' }]);
    const retried = withRetry(provider);

    const result = await retried.getSnapshot();

    expect(result).toEqual({ revision: r('1'), data: 'ok' });
    expect(provider.callCount).toBe(1);
  });

  it('retries on failure and succeeds', async () => {
    const provider = makeProvider<string>([
      new Error('fail 1'),
      new Error('fail 2'),
      { revision: r('1'), data: 'ok' },
    ]);

    const retried = withRetry(provider, {
      maxAttempts: 3,
      initialDelayMs: 10,
      backoffMultiplier: 1,
    });

    const result = await retried.getSnapshot();

    expect(result).toEqual({ revision: r('1'), data: 'ok' });
    expect(provider.callCount).toBe(3);
  });

  it('throws after exhausting all attempts', async () => {
    const provider = makeProvider<string>([
      new Error('fail 1'),
      new Error('fail 2'),
      new Error('fail 3'),
    ]);

    const retried = withRetry(provider, {
      maxAttempts: 3,
      initialDelayMs: 10,
      backoffMultiplier: 1,
    });

    await expect(retried.getSnapshot()).rejects.toThrow('fail 3');
    expect(provider.callCount).toBe(3);
  });

  it('calls onRetry with attempt info', async () => {
    const provider = makeProvider<string>([new Error('fail'), { revision: r('1'), data: 'ok' }]);

    const retryLogs: Array<{ attempt: number; nextDelayMs: number }> = [];

    const retried = withRetry(
      provider,
      { maxAttempts: 3, initialDelayMs: 100, backoffMultiplier: 2 },
      (info) => retryLogs.push({ attempt: info.attempt, nextDelayMs: info.nextDelayMs }),
    );

    await retried.getSnapshot();

    expect(retryLogs).toHaveLength(1);
    expect(retryLogs[0].attempt).toBe(1);
    expect(retryLogs[0].nextDelayMs).toBe(100);
  });

  it('respects maxDelayMs cap', async () => {
    const provider = makeProvider<string>([
      new Error('fail 1'),
      new Error('fail 2'),
      new Error('fail 3'),
      { revision: r('1'), data: 'ok' },
    ]);

    const retryLogs: Array<{ nextDelayMs: number }> = [];

    const retried = withRetry(
      provider,
      { maxAttempts: 4, initialDelayMs: 100, backoffMultiplier: 10, maxDelayMs: 500 },
      (info) => retryLogs.push({ nextDelayMs: info.nextDelayMs }),
    );

    await retried.getSnapshot();

    // Delays: 100 (100*10^0), 500 (capped from 1000), 500 (capped from 10000)
    expect(retryLogs[0].nextDelayMs).toBe(100);
    expect(retryLogs[1].nextDelayMs).toBe(500);
    expect(retryLogs[2].nextDelayMs).toBe(500);
  });

  it('uses default policy when none provided', async () => {
    const provider = makeProvider<string>([new Error('fail'), { revision: r('1'), data: 'ok' }]);

    const onRetry = vi.fn();
    const retried = withRetry(provider, undefined, onRetry);

    await retried.getSnapshot();

    expect(onRetry).toHaveBeenCalledOnce();
    // default initialDelayMs = 500, backoffMultiplier = 2, attempt 0 -> 500 * 2^0 = 500
    expect(onRetry.mock.calls[0][0].nextDelayMs).toBe(500);
  });
});

describe('tagLogger (DX sugar)', () => {
  it('merges static tags into extra payload', () => {
    const calls: unknown[] = [];
    const base = {
      debug: (_m: string, extra?: unknown) => calls.push(extra),
      warn: (_m: string, extra?: unknown) => calls.push(extra),
      error: (_m: string, extra?: unknown) => calls.push(extra),
    };

    const logger = tagLogger(base, { windowId: 'main', sourceId: 'w1' });
    logger.debug('x', { topic: 't' });
    logger.warn('x');

    expect(calls[0]).toEqual({ windowId: 'main', sourceId: 'w1', topic: 't' });
    expect(calls[1]).toEqual({ windowId: 'main', sourceId: 'w1' });
  });
});

describe('withRetryReporting (DX sugar)', () => {
  it('reports retry attempts via onError with attempt/backoff fields', async () => {
    const errors: Array<{
      phase: string;
      attempt?: number;
      willRetry?: boolean;
      nextDelayMs?: number;
    }> = [];

    let attempts = 0;
    const provider: SnapshotProvider<null> = {
      async getSnapshot() {
        attempts++;
        if (attempts <= 2) throw new Error('boom');
        return { revision: r('1'), data: null };
      },
    };

    const retrying = withRetryReporting(provider, {
      topic: 't',
      policy: { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 1, maxDelayMs: 0 },
      logger: createConsoleLogger({ debug: false }),
      onError: (ctx) =>
        errors.push({
          phase: ctx.phase,
          attempt: ctx.attempt,
          willRetry: ctx.willRetry,
          nextDelayMs: ctx.nextDelayMs,
        }),
    });

    await retrying.getSnapshot();

    expect(errors).toHaveLength(2);
    expect(errors[0]).toEqual({
      phase: 'getSnapshot',
      attempt: 1,
      willRetry: true,
      nextDelayMs: 0,
    });
    expect(errors[1]).toEqual({
      phase: 'getSnapshot',
      attempt: 2,
      willRetry: true,
      nextDelayMs: 0,
    });
  });
});
