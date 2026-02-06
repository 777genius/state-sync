import { describe, expect, it, vi } from 'vitest';
import { createTauriFileBackend } from '../src/persistence';

type Revision = string & { readonly __brand: 'Revision' };
const r = (v: string) => v as Revision;

describe('createTauriFileBackend', () => {
  it('saves snapshot via invoke', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined);

    const storage = createTauriFileBackend<string>({
      invoke,
      saveCommand: 'save_state',
      loadCommand: 'load_state',
    });

    await storage.save({ revision: r('1'), data: 'hello' });

    expect(invoke).toHaveBeenCalledWith('save_state', {
      snapshot: { revision: '1', data: 'hello' },
    });
  });

  it('loads snapshot via invoke', async () => {
    const invoke = vi.fn().mockResolvedValue({ revision: '5', data: 'cached' });

    const storage = createTauriFileBackend<string>({
      invoke,
      saveCommand: 'save_state',
      loadCommand: 'load_state',
    });

    const loaded = await storage.load();

    expect(invoke).toHaveBeenCalledWith('load_state', {});
    expect(loaded?.revision).toBe('5');
    expect(loaded?.data).toBe('cached');
  });

  it('returns null when invoke returns null', async () => {
    const invoke = vi.fn().mockResolvedValue(null);

    const storage = createTauriFileBackend<string>({
      invoke,
      saveCommand: 'save_state',
      loadCommand: 'load_state',
    });

    const loaded = await storage.load();

    expect(loaded).toBeNull();
  });

  it('returns null when invoke returns undefined', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined);

    const storage = createTauriFileBackend<string>({
      invoke,
      saveCommand: 'save_state',
      loadCommand: 'load_state',
    });

    const loaded = await storage.load();

    expect(loaded).toBeNull();
  });

  it('clears via clearCommand when provided', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined);

    const storage = createTauriFileBackend<string>({
      invoke,
      saveCommand: 'save_state',
      loadCommand: 'load_state',
      clearCommand: 'clear_state',
    });

    await storage.clear?.();

    expect(invoke).toHaveBeenCalledWith('clear_state', {});
  });

  it('clear is no-op when clearCommand not provided', async () => {
    const invoke = vi.fn();

    const storage = createTauriFileBackend<string>({
      invoke,
      saveCommand: 'save_state',
      loadCommand: 'load_state',
    });

    await storage.clear?.();

    expect(invoke).not.toHaveBeenCalled();
  });

  it('passes additional args to all commands', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined);

    const storage = createTauriFileBackend<string>({
      invoke,
      saveCommand: 'save_state',
      loadCommand: 'load_state',
      clearCommand: 'clear_state',
      args: { userId: '123', scope: 'settings' },
    });

    await storage.save({ revision: r('1'), data: 'test' });
    await storage.load();
    await storage.clear?.();

    expect(invoke).toHaveBeenNthCalledWith(1, 'save_state', {
      snapshot: { revision: '1', data: 'test' },
      userId: '123',
      scope: 'settings',
    });
    expect(invoke).toHaveBeenNthCalledWith(2, 'load_state', {
      userId: '123',
      scope: 'settings',
    });
    expect(invoke).toHaveBeenNthCalledWith(3, 'clear_state', {
      userId: '123',
      scope: 'settings',
    });
  });

  it('propagates save errors', async () => {
    const invoke = vi.fn().mockRejectedValue(new Error('Save failed'));

    const storage = createTauriFileBackend<string>({
      invoke,
      saveCommand: 'save_state',
      loadCommand: 'load_state',
    });

    await expect(storage.save({ revision: r('1'), data: 'test' })).rejects.toThrow('Save failed');
  });

  it('propagates load errors', async () => {
    const invoke = vi.fn().mockRejectedValue(new Error('Load failed'));

    const storage = createTauriFileBackend<string>({
      invoke,
      saveCommand: 'save_state',
      loadCommand: 'load_state',
    });

    await expect(storage.load()).rejects.toThrow('Load failed');
  });
});
