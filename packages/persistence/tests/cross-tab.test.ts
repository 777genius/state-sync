import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCrossTabSync,
  isBroadcastChannelSupported,
  withCrossTabSync,
} from '../src/cross-tab';

type Revision = string & { readonly __brand: 'Revision' };
const r = (v: string) => v as Revision;

// Mock BroadcastChannel
class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  closed = false;

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(message: unknown) {
    if (this.closed) return;
    // Broadcast to all other instances with the same name
    for (const instance of MockBroadcastChannel.instances) {
      if (instance !== this && instance.name === this.name && !instance.closed) {
        if (instance.onmessage) {
          instance.onmessage(new MessageEvent('message', { data: message }));
        }
      }
    }
  }

  close() {
    this.closed = true;
    const idx = MockBroadcastChannel.instances.indexOf(this);
    if (idx >= 0) MockBroadcastChannel.instances.splice(idx, 1);
  }

  static reset() {
    MockBroadcastChannel.instances = [];
  }
}

describe('cross-tab sync', () => {
  describe('isBroadcastChannelSupported', () => {
    it('returns false when BroadcastChannel is not defined', () => {
      // In Node.js, BroadcastChannel is not defined by default
      const original = globalThis.BroadcastChannel;
      globalThis.BroadcastChannel = undefined as unknown as typeof BroadcastChannel;

      expect(isBroadcastChannelSupported()).toBe(false);

      globalThis.BroadcastChannel = original;
    });

    it('returns true when BroadcastChannel is defined', () => {
      vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

      expect(isBroadcastChannelSupported()).toBe(true);

      vi.unstubAllGlobals();
    });
  });

  describe('createCrossTabSync', () => {
    beforeEach(() => {
      MockBroadcastChannel.reset();
      vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('creates a cross-tab sync instance', () => {
      const crossTab = createCrossTabSync<string>({
        channelName: 'test-channel',
      });

      expect(crossTab).toBeDefined();
      expect(crossTab.isSupported()).toBe(true);
      expect(crossTab.getTabId()).toBeTruthy();

      crossTab.dispose();
    });

    it('generates unique tab IDs', () => {
      const crossTab1 = createCrossTabSync<string>({ channelName: 'test' });
      const crossTab2 = createCrossTabSync<string>({ channelName: 'test' });

      expect(crossTab1.getTabId()).not.toBe(crossTab2.getTabId());

      crossTab1.dispose();
      crossTab2.dispose();
    });

    it('broadcasts snapshot to other tabs', () => {
      const onSnapshot = vi.fn();

      const tab1 = createCrossTabSync<string>({ channelName: 'test' });
      const tab2 = createCrossTabSync<string>({
        channelName: 'test',
        onSnapshot,
      });

      const snapshot = { revision: r('1'), data: 'hello' };
      tab1.broadcast(snapshot);

      expect(onSnapshot).toHaveBeenCalledWith(snapshot, tab1.getTabId());

      tab1.dispose();
      tab2.dispose();
    });

    it('does not receive own messages', () => {
      const onSnapshot = vi.fn();

      const tab = createCrossTabSync<string>({
        channelName: 'test',
        onSnapshot,
      });

      tab.broadcast({ revision: r('1'), data: 'hello' });

      expect(onSnapshot).not.toHaveBeenCalled();

      tab.dispose();
    });

    it('handles request-sync messages', () => {
      const onSyncRequest = vi.fn();

      const tab1 = createCrossTabSync<string>({ channelName: 'test' });
      const tab2 = createCrossTabSync<string>({
        channelName: 'test',
        onSyncRequest,
      });

      tab1.requestSync();

      expect(onSyncRequest).toHaveBeenCalledWith(tab1.getTabId());

      tab1.dispose();
      tab2.dispose();
    });

    it('handles clear messages', () => {
      const onClear = vi.fn();

      const tab1 = createCrossTabSync<string>({ channelName: 'test' });
      const tab2 = createCrossTabSync<string>({
        channelName: 'test',
        onClear,
      });

      tab1.notifyClear();

      expect(onClear).toHaveBeenCalledWith(tab1.getTabId());

      tab1.dispose();
      tab2.dispose();
    });

    it('respects receiveUpdates=false option', () => {
      const onSnapshot = vi.fn();

      const tab1 = createCrossTabSync<string>({ channelName: 'test' });
      const tab2 = createCrossTabSync<string>({
        channelName: 'test',
        receiveUpdates: false,
        onSnapshot,
      });

      tab1.broadcast({ revision: r('1'), data: 'hello' });

      expect(onSnapshot).not.toHaveBeenCalled();

      tab1.dispose();
      tab2.dispose();
    });

    it('respects broadcastSaves=false option', () => {
      const onSnapshot = vi.fn();

      const tab1 = createCrossTabSync<string>({
        channelName: 'test',
        broadcastSaves: false,
      });
      const tab2 = createCrossTabSync<string>({
        channelName: 'test',
        onSnapshot,
      });

      tab1.broadcast({ revision: r('1'), data: 'hello' });

      expect(onSnapshot).not.toHaveBeenCalled();

      tab1.dispose();
      tab2.dispose();
    });

    it('stops receiving messages after dispose', () => {
      const onSnapshot = vi.fn();

      const tab1 = createCrossTabSync<string>({ channelName: 'test' });
      const tab2 = createCrossTabSync<string>({
        channelName: 'test',
        onSnapshot,
      });

      tab2.dispose();

      tab1.broadcast({ revision: r('1'), data: 'hello' });

      expect(onSnapshot).not.toHaveBeenCalled();

      tab1.dispose();
    });

    it('does not broadcast after dispose', () => {
      const onSnapshot = vi.fn();

      const tab1 = createCrossTabSync<string>({ channelName: 'test' });
      const tab2 = createCrossTabSync<string>({
        channelName: 'test',
        onSnapshot,
      });

      tab1.dispose();
      tab1.broadcast({ revision: r('1'), data: 'hello' });

      expect(onSnapshot).not.toHaveBeenCalled();

      tab2.dispose();
    });
  });

  describe('createCrossTabSync (no-op fallback)', () => {
    beforeEach(() => {
      vi.stubGlobal('BroadcastChannel', undefined);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('creates no-op instance when BroadcastChannel is not supported', () => {
      const crossTab = createCrossTabSync<string>({
        channelName: 'test',
      });

      expect(crossTab.isSupported()).toBe(false);
      expect(crossTab.getTabId()).toBeTruthy();

      // These should not throw
      crossTab.broadcast({ revision: r('1'), data: 'hello' });
      crossTab.requestSync();
      crossTab.notifyClear();
      crossTab.dispose();
    });
  });

  describe('withCrossTabSync', () => {
    beforeEach(() => {
      MockBroadcastChannel.reset();
      vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('wraps storage.save and broadcasts', async () => {
      const mockStorage = {
        save: vi.fn().mockResolvedValue(undefined),
      };
      const onSnapshot = vi.fn();

      const tab1 = withCrossTabSync(mockStorage, { channelName: 'test' });
      const tab2 = createCrossTabSync<string>({
        channelName: 'test',
        onSnapshot,
      });

      const snapshot = { revision: r('1'), data: 'hello' };
      await tab1.save(snapshot);

      expect(mockStorage.save).toHaveBeenCalledWith(snapshot);
      expect(onSnapshot).toHaveBeenCalledWith(snapshot, tab1.crossTab.getTabId());

      tab1.crossTab.dispose();
      tab2.dispose();
    });

    it('provides access to crossTab instance', () => {
      const mockStorage = {
        save: vi.fn().mockResolvedValue(undefined),
      };

      const wrapped = withCrossTabSync(mockStorage, { channelName: 'test' });

      expect(wrapped.crossTab).toBeDefined();
      expect(wrapped.crossTab.isSupported()).toBe(true);

      wrapped.crossTab.dispose();
    });
  });
});
