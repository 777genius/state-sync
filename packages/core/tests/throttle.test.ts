import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThrottledHandler } from '../src/throttle';

describe('createThrottledHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('passthrough (no options)', () => {
    it('calls onRefresh immediately when no options provided', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh);

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(2);
    });

    it('hasPending returns false', () => {
      const handler = createThrottledHandler(vi.fn());
      handler.trigger();
      expect(handler.hasPending()).toBe(false);
    });

    it('dispose is a no-op', () => {
      const handler = createThrottledHandler(vi.fn());
      expect(() => handler.dispose()).not.toThrow();
    });
  });

  describe('debounce', () => {
    it('waits for silence before calling onRefresh', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, { debounceMs: 100 });

      handler.trigger();
      expect(onRefresh).not.toHaveBeenCalled();
      expect(handler.hasPending()).toBe(true);

      vi.advanceTimersByTime(50);
      handler.trigger();
      expect(onRefresh).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(onRefresh).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      expect(handler.hasPending()).toBe(false);
    });

    it('10 rapid events result in 1 refresh', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, { debounceMs: 100 });

      for (let i = 0; i < 10; i++) {
        handler.trigger();
        vi.advanceTimersByTime(10);
      }

      expect(onRefresh).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('dispose clears pending timer', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, { debounceMs: 100 });

      handler.trigger();
      expect(handler.hasPending()).toBe(true);

      handler.dispose();
      expect(handler.hasPending()).toBe(false);

      vi.advanceTimersByTime(200);
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('throttle', () => {
    it('calls immediately on first event (leading: true)', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, {
        throttleMs: 100,
        leading: true,
        trailing: true,
      });

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('does not call immediately when leading: false', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, {
        throttleMs: 100,
        leading: false,
        trailing: true,
      });

      handler.trigger();
      expect(onRefresh).not.toHaveBeenCalled();
      expect(handler.hasPending()).toBe(true);

      vi.advanceTimersByTime(100);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('suppresses events within throttle window', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, {
        throttleMs: 100,
        leading: true,
        trailing: true,
      });

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);

      handler.trigger();
      handler.trigger();
      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('calls trailing edge after throttle window', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, {
        throttleMs: 100,
        leading: true,
        trailing: true,
      });

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);

      handler.trigger();
      vi.advanceTimersByTime(100);
      expect(onRefresh).toHaveBeenCalledTimes(2);
    });

    it('does not call trailing when trailing: false', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, {
        throttleMs: 100,
        leading: true,
        trailing: false,
      });

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);

      handler.trigger();
      vi.advanceTimersByTime(200);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('allows new call after throttle window', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, {
        throttleMs: 100,
        leading: true,
        trailing: false,
      });

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(150);
      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(2);
    });

    it('dispose clears trailing timer', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, {
        throttleMs: 100,
        leading: true,
        trailing: true,
      });

      handler.trigger();
      handler.trigger();

      handler.dispose();

      vi.advanceTimersByTime(200);
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('combined debounce + throttle', () => {
    it('debounces within throttle window', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, {
        debounceMs: 50,
        throttleMs: 200,
        leading: true,
        trailing: true,
      });

      handler.trigger();

      vi.advanceTimersByTime(50);
      expect(onRefresh).toHaveBeenCalledTimes(1);

      handler.trigger();
      vi.advanceTimersByTime(30);
      handler.trigger();
      vi.advanceTimersByTime(30);
      handler.trigger();

      expect(onRefresh).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(50);

      vi.advanceTimersByTime(200);
      expect(onRefresh).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('handles empty options object', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, {});

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('handles zero debounceMs', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, { debounceMs: 0 });

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('handles zero throttleMs', () => {
      const onRefresh = vi.fn();
      const handler = createThrottledHandler(onRefresh, { throttleMs: 0 });

      handler.trigger();
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('multiple dispose calls are safe', () => {
      const handler = createThrottledHandler(vi.fn(), { debounceMs: 100 });
      handler.trigger();

      expect(() => {
        handler.dispose();
        handler.dispose();
        handler.dispose();
      }).not.toThrow();
    });
  });
});
