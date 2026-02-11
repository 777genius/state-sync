import type { RevisionSyncHandle, SnapshotEnvelope } from '@statesync/core';
import { createTauriRevisionSync } from '@statesync/tauri';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import { type DemoState, store } from './store';

const INVALIDATION_EVENT = 'state-sync:invalidation';

export function createDemoSync(): RevisionSyncHandle {
  return createTauriRevisionSync<DemoState>({
    topic: 'demo',
    listen,
    invoke,
    eventName: INVALIDATION_EVENT,
    commandName: 'get_demo_snapshot',
    applier: {
      apply(snapshot: SnapshotEnvelope<DemoState>) {
        store.counter = snapshot.data.counter;
        store.color = snapshot.data.color;
        store.sliderValue = snapshot.data.sliderValue;
        store.text = snapshot.data.text;
        store.revision = snapshot.revision;
      },
    },
    onError: (ctx) => {
      console.error(`[demo-sync] error (${ctx.phase}):`, ctx.error);
    },
  });
}

export async function updateState(patch: Partial<Omit<DemoState, 'revision'>>): Promise<void> {
  await invoke('update_demo_state', patch);
}
