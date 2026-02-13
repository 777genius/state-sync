/**
 * Tauri frontend — Zustand store synced across windows.
 *
 * Demonstrates:
 * - Zustand store definition with settings
 * - createTauriRevisionSync setup with listen/invoke
 * - Write path via invoke('update_settings')
 * - Init and cleanup lifecycle
 */

import { createTauriRevisionSync } from '@statesync/tauri';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────

interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
  notificationsEnabled: boolean;
  autoSave: boolean;
  sidebarCollapsed: boolean;
}

// ─── Store ──────────────────────────────────────────

const useSettingsStore = create<Settings>()(() => ({
  theme: 'system',
  language: 'en',
  fontSize: 14,
  notificationsEnabled: true,
  autoSave: true,
  sidebarCollapsed: false,
}));

// ─── Sync setup ─────────────────────────────────────

const sync = createTauriRevisionSync<Settings>({
  topic: 'settings',
  listen,
  invoke,
  eventName: 'settings:invalidated',
  commandName: 'get_settings',
  applier: createZustandSnapshotApplier(useSettingsStore),
  onError(ctx) {
    console.error(`[sync] phase=${ctx.phase}`, ctx.error);
  },
});

// Start sync on page load
await sync.start();

// ─── Write path ─────────────────────────────────────

async function toggleTheme() {
  const current = useSettingsStore.getState();
  const nextTheme = current.theme === 'dark' ? 'light' : 'dark';
  await invoke('update_settings', {
    settings: { ...current, theme: nextTheme },
  });
}

async function changeFontSize(size: number) {
  const current = useSettingsStore.getState();
  await invoke('update_settings', {
    settings: { ...current, fontSize: size },
  });
}

// ─── Cleanup on unload ──────────────────────────────

window.addEventListener('beforeunload', () => {
  sync.stop();
});

export { useSettingsStore, toggleTheme, changeFontSize };
