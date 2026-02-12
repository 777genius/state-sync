/**
 * Electron renderer — Zustand store synced across windows.
 *
 * Demonstrates:
 * - Zustand store definition with settings
 * - createElectronRevisionSync setup
 * - Write path via exposed api.updateSettings
 * - Init and cleanup lifecycle
 */

import { createElectronRevisionSync } from '@statesync/electron';
import { createZustandSnapshotApplier } from '@statesync/zustand';
import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────

declare global {
  interface Window {
    statesync: import('@statesync/electron').ElectronStateSyncBridge;
    api: {
      updateSettings: (patch: Record<string, unknown>) => Promise<{ ok: boolean }>;
    };
  }
}

// ─── Store ──────────────────────────────────────────

interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
  fontSize: number;
  sidebarCollapsed: boolean;
}

const useSettingsStore = create<SettingsState>()(() => ({
  theme: 'dark',
  language: 'en',
  fontSize: 14,
  sidebarCollapsed: false,
}));

// ─── Sync setup ─────────────────────────────────────

const sync = createElectronRevisionSync<SettingsState>({
  topic: 'settings',
  bridge: window.statesync,
  applier: createZustandSnapshotApplier(useSettingsStore),
});

// Start sync on page load
sync.start();

// ─── Write path ─────────────────────────────────────

async function toggleTheme() {
  const current = useSettingsStore.getState().theme;
  await window.api.updateSettings({ theme: current === 'dark' ? 'light' : 'dark' });
}

async function changeFontSize(size: number) {
  await window.api.updateSettings({ fontSize: size });
}

// ─── Cleanup on unload ──────────────────────────────

window.addEventListener('beforeunload', () => {
  sync.stop();
});

export { useSettingsStore, toggleTheme, changeFontSize };
