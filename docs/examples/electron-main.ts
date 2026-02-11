/**
 * Full Electron main process example — multi-window state sync.
 *
 * Demonstrates:
 * - BrowserWindow creation with secure webPreferences
 * - State management with createElectronBroadcaster + createElectronSnapshotHandler
 * - IPC handler for renderer → main write path
 * - Proper lifecycle cleanup
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import {
  createElectronBroadcaster,
  createElectronSnapshotHandler,
} from '@statesync/electron';

// ─── State ──────────────────────────────────────────

interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  fontSize: number;
  sidebarCollapsed: boolean;
}

let state: AppSettings = {
  theme: 'dark',
  language: 'en',
  fontSize: 14,
  sidebarCollapsed: false,
};

let rev = 0;

// ─── State sync primitives ─────────────────────────

const broadcaster = createElectronBroadcaster({
  topic: 'settings',
  getTargets: () => BrowserWindow.getAllWindows().map((w) => w.webContents),
});

const snapshotHandler = createElectronSnapshotHandler({
  topic: 'settings',
  getSnapshot: () => ({ revision: String(rev), data: state }),
  handle: ipcMain.handle.bind(ipcMain),
  removeHandler: ipcMain.removeHandler.bind(ipcMain),
});

// ─── Write path: renderer → main ────────────────────

ipcMain.handle('update-settings', (_event, patch: Partial<AppSettings>) => {
  state = { ...state, ...patch };
  rev++;
  broadcaster.invalidate(String(rev));
  return { ok: true };
});

// ─── Window creation ────────────────────────────────

function createWindow(title: string): BrowserWindow {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  return win;
}

// ─── App lifecycle ──────────────────────────────────

app.whenReady().then(() => {
  createWindow('Window 1');
  createWindow('Window 2');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow('Window 1');
    }
  });
});

app.on('window-all-closed', () => {
  snapshotHandler.dispose();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
